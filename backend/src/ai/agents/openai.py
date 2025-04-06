from src.core.config import config

from openai import OpenAI

openai_client = OpenAI(api_key=config.OPENAI_KEY)
