import numpy as np
import hashlib

max_uint32 = np.iinfo(np.uint32).max


def hash_address(address: str) -> int:
    return int(hashlib.sha256(address.encode()).hexdigest(), 16) % max_uint32
