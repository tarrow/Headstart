#!/usr/bin/env python3
import csv
arr = []
if __name__ == "__main__":
    with open('./toolbox.csv', 'r') as f:
        reader = csv.DictReader(f, delimiter=',')
        for row in reader:
            arr.append(row)

newArr = []
hierarchy = {}
for elem in arr:
    areas_and_tools = elem['Tools'].split(',')
    for entry in areas_and_tools:
        area_tool_tuple = entry.strip().split(':')
        if area_tool_tuple[0] not in hierarchy:
            hierarchy[area_tool_tuple[0]] = set()
        hierarchy[area_tool_tuple[0]].add(area_tool_tuple[1])
print(hierarchy)

with open('./toolboxv2.csv', 'w') as new_csv:
    writer = csv.writer(new_csv, delimiter=',')
    writer.writerow(arr[0])
    for key in hierarchy:
        for elem in hierarchy[key]:
            projects = []
            for project in arr:
                if elem in project['Tools']:
                    projects.append(project['title'])
            writer.writerow(['', '', '1', key, '', ' '.join(projects), '', '1.', hash(key + elem), elem, hash(key+elem),'0','1.', '2017'])
