from scholarly import scholarly
from call_function_with_timeout import SetTimeoutDecorator
import json
from datetime import datetime
import os
import time
import requests
import re


# make your function with timeout
@SetTimeoutDecorator(timeout=30)
def search_google_scholar():
    print("Search by scholarly...")
    author: dict = scholarly.search_author_id(os.environ['GOOGLE_SCHOLAR_ID'])
    scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
    name = author['name']
    author['updated'] = str(datetime.now())
    author['publications'] = {v['author_pub_id'] : v for v in author['publications']}
    return author

@SetTimeoutDecorator(timeout=30)
def fetch_web_content_v1():
    print("Search by requests...")
    url = "https://scholar.google.com/citations?user=oNKerP8AAAAJ&hl=en"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 检查HTTP错误状态码 (4xx/5xx)
        
        # 根据响应编码智能设置文本编码
        response.encoding = response.apparent_encoding
        content = response.text
        # print(content)
        citation = re.search(r"Citations</a></td><td class=\"gsc_rsb_std\">([\d,]+)</td>", content).group(1)
        citation = int(citation.replace(",", ""))
        author = {"citedby": citation}
        return author
    except requests.exceptions.RequestException as e:
        # 处理所有requests可能抛出的异常
        return None

@SetTimeoutDecorator(timeout=30)
def fetch_web_content_v2():
    print("Search by requests...")
    url = "https://cdn.jsdelivr.net/gh/jiemingzhu/jiemingzhu.github.io@citation/citation.json"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 检查HTTP错误状态码 (4xx/5xx)
        
        # 根据响应编码智能设置文本编码
        response.encoding = response.apparent_encoding
        content = response.text
        citation = re.search(r"\"message\": \"([\d,]+)\"\}", content).group(1)
        citation = int(citation.replace(",", ""))
        author = {"citedby": citation}
        return author
    except requests.exceptions.RequestException as e:
        # 处理所有requests可能抛出的异常
        return None

retry = 1
print("Search author on Google Scholar:")
while retry <= 10:
    print(f"Try #{retry}:")
    if retry % 3 == 1:
        is_done, is_timeout, erro_message, author = search_google_scholar()
    elif retry % 3 == 2:
        is_done, is_timeout, erro_message, author = fetch_web_content_v1()
    else:
        is_done, is_timeout, erro_message, author = fetch_web_content_v2()
    if is_done and (author is not None):
        print("Crawled citation:", author['citedby'])
        break
    else:
        print(f"Failed and sleep 10 seconds...")
        time.sleep(10)
        retry += 1

if retry > 10:
    raise TimeoutError

shieldio_dict = {
    "schemaVersion": 1,
    "label": "citations",
    "message": f"{author['citedby']}",
}
with open(f'citation.json', 'w') as outfile:
    json.dump(shieldio_dict, outfile, ensure_ascii=False)
