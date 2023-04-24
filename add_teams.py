import requests
from sys import argv, exit
from csv import DictReader
from json import load, dumps

url = 'http://localhost:3001/teams/create'
teams = {}


def main():
    if len(argv) != 2:
        exit("Invalid Usage")

    file_name = argv[1]

    with open(file_name, "r") as jsonfile:
        teams = load(jsonfile)

    for num, team in teams.items():

        data = {
            'name': team["Team Name"],
            'teamid': num,
            'member1': team["Participants"][0],
            'member2': team["Participants"][1] if len(team["Participants"]) > 1 else None,
            'member3': team["Participants"][2] if len(team["Participants"]) > 2 else None,
            'theme': team["Category"]
        }

        response = requests.post(url, data=data)

        if response.ok:
            print(f'Team created successfully! {team["Team Name"]}')
        else:
            print('Error creating team')
            print('Response:', response.text)

if __name__ == "__main__":
    main()