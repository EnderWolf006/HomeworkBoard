import { useEffect, useState } from 'react'
import './App.css'
import axios from 'axios';

let url = undefined

let subjectArrange = undefined

function getDateStr(date = new Date()) {
  return date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + "-" + date.getDate().toString().padStart(2, '0')
}

function getOffsetedDateStr(offset) {
  return getDateStr(new Date(new Date().getTime() + (offset * 24 * 60 * 60 * 1000)))
}

function getRawData(offset, callback) {
  const dateStr = getOffsetedDateStr(offset)
  axios.get(url + '/download', {
    params: {
      data: JSON.stringify({
        'date': dateStr
      })
    }
  }).then((res) => { callback(res.data) }).catch((e) => { callback({ suc: false, msg: e }) })
}

function SingleWorkCard({ content, subjectName }) {
  const contentList = content.split('\n')
  if (content == '') return <></>
  return (<>
    <div className='card'>
      <div className="title">{subjectName}</div>
      <div className="workContentBox">
        {contentList.map((v, i) => {
          return v == '' ? <></> : (<div key={Date.now() + Math.random()}>
            <label>
              <div className='singleWorkContent'><input type='checkbox' className='checkbox' />{v}</div>
            </label>
            <br />
          </div>
          )
        })}
      </div>
    </div>
  </>)
}

function WorkCards({ homeworkData }) {
  return (<>
    <div>
      {(
        subjectArrange.map((v, i) => <SingleWorkCard key={i} content={homeworkData[v].content} subjectName={homeworkData[v].name} />)
      )}
    </div>
  </>)
}

function AttendCard({ studentList, studentTotalNum }) {
  return (<>
    <div className="card">
      <div className="title">
        出勤{' '}
        <div className="subtitle">{studentTotalNum - studentList.length}
          <div className="subsubtitle subtitle">/{studentTotalNum}人{` - 未到${studentList.length}人:`}</div>
        </div>
      </div>
      <div className="attentContent">
        {studentList.map((v, i) => <div id={i}> {i + 1}.{v}</div>)}
      </div>
    </div>
    <br />
  </>)
}

function Error({ children }) {
  return (
    <div style={{ color: 'red' }}>
      {children}
    </div>
  )
}

function Loading() {
  return (
    <div style={{ color: 'gray' }}>
      加载中...
    </div>
  )
}

function MainArea({ offset }) {
  const [content, setContent] = useState(<Loading />)
  useEffect(() => {
    (async () => {
      if (!url) url = await (await (await axios.get('/config.json')).data).url
      if (!subjectArrange) subjectArrange = await (await (await axios.get('/config.json')).data).subjectArrange
      getRawData(offset, (rawData) => {
        console.log( rawData );
        if (rawData.suc) {
          setContent(
            <>
              <WorkCards homeworkData={rawData.homeworkData} />
              <AttendCard studentList={rawData.selectedStudent.map(v => rawData.studentList[v])} studentTotalNum={rawData.studentList.length} />
            </>
          )
        } else {
          setContent(<Error> {rawData.msg} </Error>)
        }
      })
    })();

  }, [offset])
  return content
}

function AppBarArea({ offset, setOffset }) {
  return (
    <div className="appBar">
      <button className="leftArrow arrow" onClick={() => setOffset(-1)}>{'<'}</button>
      {getOffsetedDateStr(offset)}
      <button className="rightArrow arrow" onClick={() => setOffset(+1)}>{'>'}</button>
    </div>
  )
}

function App() {
  const [nowOffset, setNowOffset] = useState(0);
  return (
    <>
      <AppBarArea offset={nowOffset} setOffset={(n) => { setNowOffset(nowOffset + n) }} />
      <MainArea offset={nowOffset} />
    </>
  )
}



export default App
