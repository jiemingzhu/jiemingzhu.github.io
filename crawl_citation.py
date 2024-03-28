from scholarly import scholarly
import json
from datetime import datetime
import os


author: dict = scholarly.search_author_id(os.environ['GOOGLE_SCHOLAR_ID'])
scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
name = author['name']
author['updated'] = str(datetime.now())
author['publications'] = {v['author_pub_id'] : v for v in author['publications']}
print("Crawled citation:", author['citedby'])

shieldio_dict = {
  "schemaVersion": 1,
  "label": "citations",
  "message": f"{author['citedby']}",
}
with open(f'citation.json', 'w') as outfile:
    json.dump(shieldio_dict, outfile, ensure_ascii=False)
