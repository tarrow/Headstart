#!/usr/bin/env python3
import csv
import math
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
# print(hierarchy)

def circleCoords(n, i):
    TWOPI = 2*3.14159
    angle = TWOPI/n
    return (math.cos(angle*i), math.sin(angle*i))

with open('./toolboxv2.csv', 'w') as new_csv:
    fieldnames = ['id','title','readers','x','y','area','Tools','paper_abstract','published_in','year','url','file_hash','authors','oa_state']
    writer = csv.DictWriter(new_csv, fieldnames=fieldnames)
    writer.writeheader()
    index = 0
    N = len(hierarchy.keys())
    n = 0
    for key in hierarchy:
        for elem in hierarchy[key]:
            projects = []
            for project in arr:
                if elem in project['Tools']:
                    projects.append('<li>' + project['title'] + '</li>')
            coords = circleCoords(N,n)
            new_csv_row = {}
            new_csv_row['oa_state'] = '0'
            new_csv_row['year'] = '2017'
            new_csv_row['paper_abstract'] = '<p>This will describe the subcategory and list the projects </p>. ' + '<ul>' + ' '.join(projects) + '</ul>'
            new_csv_row['Tools'] = ''
            new_csv_row['readers'] = '0'
            new_csv_row['x'] = str(coords[0])
            new_csv_row['y'] = str(coords[1])
            new_csv_row['title'] = elem
            new_csv_row['file_hash'] = hash(new_csv_row['title'])
            new_csv_row['id'] = index
            new_csv_row['authors'] = ''
            new_csv_row['published_in'] = '2017'
            new_csv_row['area'] = key
            new_csv_row['url'] = 'https://www.openuphub.eu/'
            writer.writerow(new_csv_row)
            index = index + 1
        n = n + 1