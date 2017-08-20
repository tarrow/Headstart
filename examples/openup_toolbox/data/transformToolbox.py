#!/usr/bin/env python3
import csv
arr = []
if __name__ == "__main__":
    with open('./toolbox.csv', 'r') as f:
        reader = csv.DictReader(f, delimiter=',')
        for row in reader:
            arr.append(row)

newArr = []
setOfTools = set()
for elem in arr:
    setOfTools.add(elem['Tool'])
    # print(elem)
print(setOfTools)
