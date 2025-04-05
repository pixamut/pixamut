import json
from web3 import AsyncWeb3, Web3
from web3.providers import WebSocketProvider
from pathlib import Path

from web3.contract.async_contract import AsyncContract

from src.core.config import config

with open(Path(__file__).parent / "abis" / "Token.json", "r") as file:
    TOKEN_ABI = json.load(file)["abi"]

with open(Path(__file__).parent / "abis" / "PixelStaking.json", "r") as file:
    PIXEL_STAKING_ABI = json.load(file)["abi"]

with open(Path(__file__).parent / "abis" / "ProjectFactory.json", "r") as file:
    PROJECT_FACTORY_ABI = json.load(file)["abi"]

with open(Path(__file__).parent / "abis" / "Project.json", "r") as file:
    PROJECT_ABI = json.load(file)["abi"]


provider = AsyncWeb3(WebSocketProvider(config.RPC_URL))


async def provider_connect():
    await provider.provider.connect()


account = provider.eth.account.from_key(config.ADMIN_PRIVATE_KEY)

pixel_staking_contract = provider.eth.contract(
    address=Web3.to_checksum_address(config.PIXEL_STAKING_ADDRESS),
    abi=PIXEL_STAKING_ABI,
)
token_contract = provider.eth.contract(
    address=Web3.to_checksum_address(config.IFYS_TOKEN_ADDRESS), abi=TOKEN_ABI
)
factory_contract = provider.eth.contract(
    address=Web3.to_checksum_address(config.PROJECT_FACTORY_ADDRESS),
    abi=PROJECT_FACTORY_ABI,
)


async def get_project_contract(address: str) -> AsyncContract:
    return provider.eth.contract(
        address=Web3.to_checksum_address(address), abi=PROJECT_ABI
    )
