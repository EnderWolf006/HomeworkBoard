import random
import os
import time
import json
import datetime
from flask import Flask, request, json, Response,send_from_directory
app = Flask(__name__)
dbPath = 'C:/jsondb/homeworkBoard'
try:
    os.makedirs(dbPath) 
except: 
    pass
filePath = dbPath + '/{}.json'
if not os.path.exists(dbPath):
    os.makedirs(dbPath)
@app.route('/upload',methods=['GET', 'POST'])
def upload():
    try:
        date = datetime.date.today().strftime('%Y-%m-%d')
        json.dump(json.loads(request.args.get('data')), open(filePath.format(date), 'w', encoding='utf8'), indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            'suc': False,
            'msg': '上传失败：' + str(e) 
        })
    return json.dumps({
        'suc': True,
        'msg': '上传成功' 
    })

@app.route('/download',methods=['GET', 'POST'])
def download():
    try:
        data = json.loads(request.args.get('data'))
        date = data.get('date', datetime.date.today().strftime('%Y-%m-%d'))
        info = {
            'suc': True,
            'msg': '下载成功',
        }
        return json.dumps({**info, **json.load(open(filePath.format(date), 'r', encoding='utf8'))})
    except Exception as e:
        return json.dumps({
            'suc': False,
            'msg': '下载失败：该日期未上传数据' + str(e)
        })
    
def after_request(resp):
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

app.after_request(after_request)
app.run(debug=True, host='0.0.0.0', port=17312)