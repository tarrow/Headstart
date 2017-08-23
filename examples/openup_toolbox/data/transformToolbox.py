#!/usr/bin/env python3
import csv
import math
import random

def circle_coords(n, i):
    TWOPI = 2*3.14159
    angle = TWOPI/n
    return (math.cos(angle*i), math.sin(angle*i))


def normalize_source(source_object):
    normalized_object = []
    for entry in source_object:
        tools = entry['tools'].strip().split(',')
        entry.pop('tools', None)
        for categories in tools:
            cat_and_subcat = categories.split(':')
            entry['area'] = cat_and_subcat[0].strip()
            entry['subarea'] = cat_and_subcat[1].strip()
            normalized_object.append(entry)
    return normalized_object

if __name__ == "__main__":
    SOURCE_CSV = 'source.csv'
    CSVS_TO_WRITE = [{'file':'toolbox1.csv', 'mode':'default'}, {'file':'toolbox2.csv', 'mode': 'by_tool'}]
    FIELDNAMES = ['id','title','readers','x','y','area', 'paper_abstract','published_in','year','url','file_hash','authors','oa_state', 'cost', 'audience']

    arr = []
    with open(SOURCE_CSV, 'r') as source:
        reader = csv.DictReader(source, delimiter=',')
        normalized_csv = normalize_source(reader)
        for csvf in CSVS_TO_WRITE:
            with open(csvf['file'], 'w') as current_file:

                if (csvf['mode'] == 'default'):
                    writer = csv.DictWriter(current_file, fieldnames = FIELDNAMES)
                    writer.writeheader()
                    areas = set()
                    title_area_combos = set()
                    area_coords = {}
                    for row in normalized_csv:
                        areas.add(row['area'])
                    N = len(areas)
                    for (index, area) in enumerate(areas):
                        x, y = circle_coords(N, index)
                        area_coords[area] = { 'x': str(x), 'y' : str(y)}
                    for (index, row) in enumerate(normalized_csv):
                        x, y = circle_coords(N, index)
                        title_area_combo = (row['title'], row['area'])
                        if title_area_combo not in title_area_combos:
                            title_area_combos.add(title_area_combo)
                            why = ('<h5>Why?</h5>' + row['why']) if (row['why'] != '') else ''
                            new_row = {
                                'id' : index,
                                'title' : row['title'],
                                'readers' : '0',
                                'x' : area_coords[row['area']]['x'],
                                'y' : area_coords[row['area']]['y'],
                                'area' : row['area'],
                                'paper_abstract' : '<h5>What?</h5>' + row['what'] + why,
                                'published_in' : '',
                                'year' : '',
                                'url' : row['url'],
                                'file_hash' : hash(row['title']),
                                'authors' : '',
                                'oa_state' : '0',
                                'cost' : random.choice(['low', 'medium', 'high']),
                                'audience' : random.choice(['researcher', 'funder', 'generalpublic'])
                            }
                            writer.writerow(new_row)

                if (csvf['mode'] == 'by_tool'):
                    writer = csv.DictWriter(current_file, fieldnames = FIELDNAMES)
                    writer.writeheader()
                    areas = set()
                    title_area_combos = set()
                    area_coords = {}
                    subarea_projects = {}
                    for row in normalized_csv:
                        areas.add(row['area'])
                    N = len(areas)
                    for (index, area) in enumerate(areas):
                        x, y = circle_coords(N, index)
                        area_coords[area] = { 'x': str(x), 'y' : str(y)}
                    for row in normalized_csv:
                        if row['subarea'] not in subarea_projects:
                            subarea_projects[row['subarea']] = []
                        new_entry = '<li><a href=\"' + row['url'] + '\">' + row['title'] + '</a></li>'
                        if new_entry not in subarea_projects[row['subarea']]:
                            subarea_projects[row['subarea']].append(new_entry)
                    for (index, row) in enumerate(normalized_csv):
                        title_area_combo = (row['subarea'], row['area'])
                        if title_area_combo not in title_area_combos:
                            title_area_combos.add(title_area_combo)
                            new_row = {
                                'id' : index,
                                'title' : row['subarea'],
                                'readers' : '0',
                                'x' : area_coords[row['area']]['x'],
                                'y' : area_coords[row['area']]['y'],
                                'area' : row['area'],
                                'paper_abstract' : '<ul>' + ''.join(subarea_projects[row['subarea']]) + '</ul>',
                                'published_in' : '',
                                'year' : '',
                                'url' : 'http://www.openuphub.eu',
                                'file_hash' : hash(row['title']),
                                'authors' : '',
                                'oa_state' : '0'
                            }
                            writer.writerow(new_row)