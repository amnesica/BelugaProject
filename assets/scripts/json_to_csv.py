import json
import csv
import sys


def get_header_for_input_file(input_filename):
    if input_filename == "aircrafts.json":
        return ["hex", "reg", "typecode", "military"]
    elif input_filename == "operators.json":
        return ["operator_icao", "operator_name", "operator_country", "operator_callsign"]
    elif input_filename == "types.json":
        return ["typecode", "aircraft_description", "icao_aircraft_type", "wtc"]


def create_csv_from_json(input_filename):
    print('Starting conversion json -> csv for ' + input_filename)
    with open(input_filename) as json_file:
        json_data = json.load(json_file)

    data_file = open(input_filename.split(".")[0] + '.csv', 'w', newline='')
    csv_writer = csv.writer(data_file)

    header = get_header_for_input_file(input_filename)
    if not header:
        print("No header found for " + input_filename + ". Program will exit.")
        sys.exit()

    count = 0
    for key in json_data:
        if count == 0:
            csv_writer.writerow(header)
            count += 1
        # construct row with same length (some keys have more value than others)
        row = [key, json_data[key][0], json_data[key][1], json_data[key][2]]
        csv_writer.writerow(row)

    data_file.close()
    print('Finished conversion json -> csv for ' + input_filename)


def main():
    if len(sys.argv) < 2:
        print('No input_filename for conversion from json -> csv found. Program will exit.')
        sys.exit()

    input_filename = sys.argv[1]
    print('Provided filename for conversion: ' + input_filename)

    create_csv_from_json(input_filename)


main()
