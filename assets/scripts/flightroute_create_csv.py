# -------------------------------------------------------------
# This script creates flightroute_data.csv
# from VRS standing-data Github repository
# -------------------------------------------------------------
from pathlib import Path
import pandas as pd
import os
import sys


# -------------------------------------------------------------
# read routes directory with flightroute csv-files
# (passed as parameter)
# -------------------------------------------------------------
try:
    directory_name=sys.argv[1]
    print(directory_name)
except:
    print('Please pass directory_name')

# -------------------------------------------------------------
# remove files from previous execution
# -------------------------------------------------------------
myfile = "combined_file.csv"
# If file exists, delete it.
if os.path.isfile(myfile):
    os.remove(myfile)
else:
    # If it fails, inform the user.
    print("Info: prevoius version of %s file not found. Okay."  % myfile)

myfile = "flightroute_data.csv"
# If file exists, delete it.
if os.path.isfile(myfile):
    os.remove(myfile)
else:
    # If it fails, inform the user.
    print("Info: prevoius version of %s file not found. Okay." % myfile)

# -------------------------------------------------------------
# combine multiple csv-files
# from routes directory including subdirectories
# -------------------------------------------------------------
csv_folder = Path(directory_name)
df = pd.concat(pd.read_csv(p) for p in csv_folder.glob('**/*.csv'))
df.to_csv(os.path.join('.', 'combined_file.csv'), index=False)

# -------------------------------------------------------------
# remove unused columns and export to flightroute_data.csv
# -------------------------------------------------------------
f=pd.read_csv("combined_file.csv")
keep_col = ['Callsign','AirportCodes']
new_f = f[keep_col]
new_f.to_csv("flightroute_data.csv", index=False)
