# library for env loading
from dotenv import load_dotenv  # load env file

# library for os
import os  # access env vars

# get current file path
cur_dir = os.path.dirname(__file__)  # current folder path

# create .env path
env_path = os.path.join(cur_dir, ".env")  # full path of .env

# print env file path
print("env file path:", env_path)  # check path

# load env with override
load_dotenv(dotenv_path=env_path, override=True)  # force load .env

# fetch api key
api_key = os.getenv("GEMINI_API_KEY")  # get key

# print raw env file content
print("\n.env file content:\n")  # label
try:
    with open(env_path, "r") as f:  # open file
        print(f.read())  # print content
except:
    print("env file not found")  # error case

# print loaded key
print("\nloaded api key:\n")  # label
print(api_key)  # show key

# print key length
if api_key:
    print("\nkey length:", len(api_key))  # check valid length
else:
    print("\nno key loaded")  # if missing

# check system env separately
print("\nsystem env value:\n")  # label
print(os.environ.get("GEMINI_API_KEY"))  # system env check