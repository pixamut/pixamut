import numpy as np
import asyncio
from sqlalchemy.ext.asyncio.session import AsyncSession
from web3.types import TxParams
from src.ai.image.image_processing import image_to_np
from src.ai.utils import hash_address
from src.ai.placement.placement_sliding import find_best_placement_full
from src.ai.placement.placement_actions import generate_actions_for_placement
from src.models.session import async_session
from src.models.pixamut.action.action_crud import (
    ACTIONS,
    ActionCall,
    ActionMethod,
    ActionCreate,
)
from src.contracts.provider import get_project_contract
from src.models.pixamut.project.project_crud import PROJECTS, ProjectModel
from src.ai.placement.init import ether_to_wei, get_staked_by_owner_in_eth, wei_to_ether
from src.models.pixamut.project_snapshot.project_snapshot_crud import (
    PROJECT_SNAPSHOTS,
    ProjectSnapshotCreate,
)
from src.models.pixamut.pixel.pixel_crud import PIXELS
from .provider import provider, account, token_contract


async def run_transaction(
    db: AsyncSession, action: ActionCreate, project: ProjectModel, transaction: TxParams
):
    try:
        gas_estimate: int = -1
        gas_price = transaction["gasPrice"] if "gasPrice" in transaction else 0

        try:
            gas_estimate = await provider.eth.estimate_gas(transaction)
            transaction["gas"] = gas_estimate
        except Exception as e:
            print("===============Error estimating gas", e.__dict__, flush=True)
            print("===============project", wei_to_ether(project.balance), flush=True)
        if gas_estimate == -1:
            # action.hash = "failed"
            # db.add(action)
            # await db.commit()
            pass
        else:
            signed_txn = account.sign_transaction(transaction)
            tx_hash = await provider.eth.send_raw_transaction(signed_txn.rawTransaction)
            tx_receipt = await provider.eth.wait_for_transaction_receipt(tx_hash)
            project.gas_used = project.gas_used + (
                int(tx_receipt["gasUsed"]) * int(gas_price)
            )
            # action.hash = tx_hash.hex().lower()
            # action.gas_used = tx_receipt["gasUsed"]
            # db.add(action)
            db.add(project)
            await db.refresh(project)
            await db.commit()
    except Exception as e:
        print("error with transaction", e, flush=True)
        # action.hash = "failed"
        # db.add(action)
        # await db.commit()


async def run_action(db: AsyncSession, action: ActionCreate, project: ProjectModel):
    project_contract = await get_project_contract(action.address)
    call = action.call
    print(call)
    try:
        nonce = await provider.eth.get_transaction_count(account.address)
        build_params: TxParams = {
            "from": account.address,
            "nonce": nonce,
            "gas": 5000000,
        }

        gas_price = await provider.eth.gas_price
        build_params["gasPrice"] = gas_price
        transaction: TxParams | None = None
        if call.method == ActionMethod.changeColors.value:
            transaction = await project_contract.functions.changePixelsColors(
                call.pixelIds, call.colors
            ).build_transaction(build_params)
        elif call.method == ActionMethod.stakePixels.value:
            transaction = await project_contract.functions.stakePixels(
                call.pixelIds, call.amounts, call.colors
            ).build_transaction(build_params)
        elif call.method == ActionMethod.unstakePixels.value:
            transaction = await project_contract.functions.unstakePixels(
                call.pixelIds
            ).build_transaction(build_params)

        if transaction is not None:
            await run_transaction(db, action, project, transaction)
    except Exception as e:
        print("error building transaction", e, flush=True)


# lp tokens with zap functionnaly
# liquid stacking where you can borrow againt your stake


async def project_execution_loop():
    print("starting to listen to project execution loop", flush=True)

    while True:
        async with async_session() as db:
            # 1 - get all projects
            projects = await PROJECTS.get_many(db, limit=10)
            for project in projects:
                try:
                    print("gas used", wei_to_ether(project.gas_used), flush=True)
                    # if (
                    #     # project.balance > 0
                    #     # and (project.gas_available - project.gas_used) > 100_000_000
                    # ):
                    if True:
                        dbProjectSnapshot = await PROJECT_SNAPSHOTS.get(
                            db, project_address=project.address
                        )
                        if dbProjectSnapshot is None:
                            nbr_controlled_pixels = await PIXELS.get_owner_pixel_count(
                                db, owner=project.address
                            )
                            dbProjectSnapshot = await PROJECT_SNAPSHOTS.create(
                                db,
                                obj_in=ProjectSnapshotCreate(
                                    address=project.address,
                                    title=project.title,
                                    nbr_active_pixels=project.nbr_active_pixels,
                                    nbr_controlled_pixels=nbr_controlled_pixels,
                                    balance=project.balance,
                                    gas_used=project.gas_used,
                                    gas_available=project.gas_available,
                                    best_row=project.best_row,
                                    best_col=project.best_col,
                                    best_cost=project.best_cost,
                                ),
                            )
                        balance_in_eth = wei_to_ether(project.balance)
                        real_balance = await token_contract.functions.balanceOf(
                            provider.to_checksum_address(project.address)
                        ).call()  # type: ignore
                        real_balance_in_eth = wei_to_ether(real_balance)
                        budget_in_eth = real_balance_in_eth

                        if budget_in_eth <= 1:
                            print("not enough budget", budget_in_eth, flush=True)
                            continue
                        # 2 - find the best placement
                        image_grid, image_mask = image_to_np(project.image)
                        # image_grid = np.frombuffer(
                        #     project.image_grid, dtype=np.uint32
                        # ).reshape(project.image_h, project.image_w)
                        # image_mask = np.frombuffer(
                        #     project.image_mask, dtype=np.bool_
                        # ).reshape(project.image_h, project.image_w)
                        # image_mask = image_mask.astype(bool)

                        print("Mask shape", image_mask.shape, flush=True)
                        best_row, best_col, best_cost = find_best_placement_full(
                            image_color=image_grid,
                            image_mask=image_mask,
                            new_owner=hash_address(project.address),
                            budget=budget_in_eth,
                            eager=False,
                        )
                        if (
                            best_row is not None
                            and best_col is not None
                            and best_cost is not None
                        ):
                            project.best_row = best_row
                            project.best_col = best_col
                            project.best_cost = int(best_cost * 1e18)
                            remaining_budget = budget_in_eth - best_cost
                            if remaining_budget > 1:
                                remaining_budget -= 1.0
                            if remaining_budget <= 1:
                                remaining_budget = 0.0
                            print(
                                "BEST ROW, COL =============",
                                best_row,
                                best_col,
                                "remaining budget",
                                remaining_budget,
                                flush=True,
                            )
                            db.add(project)
                            await db.commit()
                            actions = generate_actions_for_placement(
                                image_grid=image_grid,
                                image_mask=image_mask,
                                nbr_active_pixels=project.nbr_active_pixels,
                                base_row=best_row,
                                base_col=best_col,
                                project_address=project.address,
                                unused_budget=remaining_budget,
                            )
                            # dbActions = await ACTIONS.setActions(
                            #     db, project_address=project.address, actions=actions
                            # )

                            for dbAction in actions:
                                await run_action(db, action=dbAction, project=project)
                                # wait between tx
                                # await asyncio.sleep(2)

                            await asyncio.sleep(1)
                            if len(actions) > 0:
                                print(
                                    "gas used",
                                    wei_to_ether(project.gas_used),
                                    flush=True,
                                )
                                nbr_controlled_pixels = (
                                    await PIXELS.get_owner_pixel_count(
                                        db, owner=project.address
                                    )
                                )
                                await PROJECT_SNAPSHOTS.create(
                                    db,
                                    obj_in=ProjectSnapshotCreate(
                                        address=project.address,
                                        title=project.title,
                                        nbr_active_pixels=project.nbr_active_pixels,
                                        nbr_controlled_pixels=nbr_controlled_pixels,
                                        balance=project.balance,
                                        gas_used=project.gas_used,
                                        gas_available=project.gas_available,
                                        best_row=project.best_row,
                                        best_col=project.best_col,
                                        best_cost=project.best_cost,
                                    ),
                                )

                    else:
                        print(
                            "Not enough gas or balance",
                            project.balance,
                            project.gas_available,
                            project.gas_used,
                            flush=True,
                        )
                    # wait between projects
                    await asyncio.sleep(1)
                except Exception as e:
                    print("Error executing project:", str(e), flush=True)
        # wait between complete projects sweep
        await asyncio.sleep(5)
