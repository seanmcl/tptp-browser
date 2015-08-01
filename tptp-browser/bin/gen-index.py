"""Generate a json index of the form public/index-example.json."""

import csv
import json
import os
import re

BASE_DIR = os.getenv('PROBLEM_DIR') or '/opt/tptp'

def make_tptp_stats():
    res = {}
    problem_row_length = 32
    str_cols = [0, 1, 2, 17, 30]
    float_cols = [3]
    tptp_dir = os.path.join(BASE_DIR, 'TPTP-v6.1.0/Documents/ProblemAndSolutionStatistics')
    with open(tptp_dir, newline='') as csvfile:
        reader = iter(csv.reader(csvfile,
                                 delimiter=' ',
                                 skipinitialspace=True))
        # Skip header
        next(reader)
        for row in reader:
            # Data for problems and solutions are mixed in the same file.
            # The rows corresponding to the solutions have fewer entries.
            if len(row) == problem_row_length:
                for idx, elem in enumerate(row):
                    if elem == '-':
                        elem = 0
                    if idx in str_cols:
                        continue
                    if idx in float_cols:
                        row[idx] = float(elem)
                        continue
                    row[idx] = int(elem)
                res[row[0]] = row
    return res


def main():
    problem_sets = [

        {'name': 'TPTP',
         'dir': 'TPTP-v6.1.0',
         'hasStats': True,
         'axioms': [],
         'problems': []},

        {'name': 'ILTP-propositional',
         'dir': 'ILTP-v1.1.2-propositional',
         'hasStats': False,
         'axioms': [],
         'problems': []},

        {'name': 'ILTP-firstorder',
         'dir': 'ILTP-v1.1.2-firstorder',
         'hasStats': False,
         'axioms': [],
         'problems': []},

    ]

    tptp_stats = make_tptp_stats()

    def walk(obj):
        name = obj['name']
        print('Starting %s' % name)
        is_tptp = name == 'TPTP'
        for type in ['Problems', 'Axioms']:
            dir = os.path.join(BASE_DIR, obj['dir'], type)
            for dir_path, dirs, files in os.walk(dir):
                for file_name in files:
                    # drop final .EXT from file name to get problem name
                    # The problem can have . in the name, so only drop the
                    # final one.
                    size = os.path.getsize(os.path.join(dir_path, file_name))
                    if is_tptp and type == 'Problems':
                        problem_name = re.sub('\\.[^.]+', '', file_name)
                        stats = tptp_stats.get(problem_name, [])
                        entry = {'file': file_name,
                                 'size': size,
                                 'stats': stats}
                    else:
                        entry = {'file': file_name,
                                 'size': size}
                    obj[type.lower()] += [entry]

    for s in problem_sets:
       walk(s)

    with open(os.path.join(BASE_DIR, 'index.json'), 'w') as f:
        json.dump(problem_sets, f)

if __name__ == '__main__':
    main()
