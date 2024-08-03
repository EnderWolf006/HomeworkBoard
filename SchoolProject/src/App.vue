<template>

  <div class="main-window">

    <div class="homework-area">
      <h1>
        作业 <div>{{ dateString }}</div>
      </h1>
      <div class="homework-container">
        <div class="homework-row" v-for="subjects in homeworkArrange">
          <div class="homework-card" v-for="subject in subjects" @click="openDialog(subject)">
            <div class="title">{{ homeworkData[subject].name }}</div>
            <div class="content" :style="contentStyle">
              <ol>
                <li v-for="text in splitPoint(homeworkData[subject].content)"> {{ text }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      <div class="homework-font-setter">
        <div class="homework-font-zoom" @click="zoom('up')"> + </div>
        <div class="homework-font-zoom" @click="zoom('out')"> - </div>
      </div>
    </div>
    <div class="attendance-area" @click="setAttendanceArea" v-if="studentList.length">
      <h1>出勤</h1>
      <h2>应到: {{ studentList.length }} 人</h2>
      <h2>实到: {{ studentList.length - selectedSet.size }} 人</h2>
      <h2 style="margin-bottom: 5px;">未到: {{ selectedSet.size }} 人</h2>
      <h3 v-for="(i, index) in selectedSet">{{ `${index + 1}. ${studentList[i]}` }}</h3>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500" :before-close="handleClose">
    <el-input v-model="textarea" autosize type="textarea" placeholder="使用换行表示分条" ref="inputRef" />
  </el-dialog>
  <el-dialog v-model="attendDialogVisible" title="设置未到学生列表" width="800">
    <div class="card" :class="selectedSet.has(i) ? 'selected' : ''" v-for="(name, i) in studentList"
      @click="(selectedSet.has(i) ? selectedSet.delete(i) : selectedSet.add(i), synced = false)">
      {{ `${i + 1}. ${name}` }}
    </div>
  </el-dialog>
  <div class="upload">
    <el-button size="large" type="primary" v-if="!synced" @click="downloadData"
      :loading="downloadLoading">下载</el-button>
    <el-button size="large" type="danger" v-if="!synced" @click="uploadData" :loading="uploadLoading">上传</el-button>
    <el-button size="large" type="success" v-else
      @click="topMessage({ message: '数据已完成与服务器同步', type: 'success' })">同步完成</el-button>
  </div>
</template>
<script setup>
import { ref, h, computed } from "vue"
import axios from "axios";
let url = ''
axios.get('/config.json').then((res) => { 
  url = res.data.url
})
let currentEditSubject = undefined
let inputRef = ref()
const studentList = ref(['加载中']);
axios.get('/config.json').then((res) => { 
  studentList.value = res.data.studentList
})
const selectedSet = ref(new Set())
const dialogVisible = ref(false)
const dialogTitle = ref('')
const textarea = ref('')
const dateString = ref('')
const synced = ref(false)
const attendDialogVisible = ref(false)
const contentStyle = ref({ 'font-size': "28px", 'padding': '0 0px' })
const uploadLoading = ref(false)
const downloadLoading = ref(false)
const homeworkData = ref({
})
const homeworkArrange = ref([
  [],
  []
])
axios.get('/config.json').then((res) => { 
  homeworkArrange.value = res.data.homeworkArrange
  for (let i = 0; i < homeworkArrange.value.length; i++) {
    for (let j = 0; j < homeworkArrange.value[i].length; j++) {
      homeworkData.value[homeworkArrange.value[i][j]] = {
        name: homeworkArrange.value[i][j],
        content: '',
      }
    }
  }
})
const handleClose = (done) => {
  homeworkData.value[currentEditSubject].content = textarea.value
  synced.value = false
  done()
}
function openDialog(subject) {
  currentEditSubject = subject
  dialogVisible.value = true
  dialogTitle.value = homeworkData.value[subject].name + '作业:'
  textarea.value = homeworkData.value[subject].content
  setTimeout(() => {
    inputRef.value.focus()
    inputRef.value.ref.setSelectionRange(textarea.value.length, textarea.value.length)
  }, 0);
}
function zoom(mode) {
  if (mode == 'up') {
    contentStyle.value['font-size'] = (Number(contentStyle.value['font-size'].replace('px', '')) + 1).toString() + 'px'
    contentStyle.value['padding'] = (Number(contentStyle.value['font-size'].replace('px', '')) - 30).toString() + 'px'
  } else if (mode == 'out') {
    contentStyle.value['font-size'] = '0' + (Number(contentStyle.value['font-size'].replace('px', '')) - 1).toString() + 'px'
    contentStyle.value['padding'] = '0' + (Number(contentStyle.value['font-size'].replace('px', '')) - 30).toString() + 'px'
  }
}
function setAttendanceArea() {
  attendDialogVisible.value = true
}
function topMessage(data) {
  ElMessage(data)
}
const splitPoint = (text) => {
  return text.split('\n')
}
function getDateStr(date) {
  return date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + "-" + date.getDate().toString().padStart(2, '0')
}
dateString.value = getDateStr(new Date())
function uploadData() {
  ElMessageBox.confirm(
    '上传数据至服务器会覆盖已上传服务器的信息，是否继续？',
    '警告',
    {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    uploadLoading.value = true
    axios.get(url + '/upload', {
      params: {
        data: JSON.stringify({
          'studentList': studentList.value,
          'selectedStudent': [...selectedSet.value],
          'homeworkData': homeworkData.value
        })
      }
    }).then((res) => {
      uploadLoading.value = false
      if (!res.data.suc) {
        ElMessage({ message: res.data.msg, type: 'info' })
        ElMessage.error(res.data.msg)
        return
      }
      ElMessage({ message: '数据上传同步成功', type: 'success' })
      synced.value = true
    }).catch((err) => {
      ElMessage.error(`上传失败：${err}`)
      uploadLoading.value = false
    })
  })
}
function downloadData() {
  ElMessageBox.confirm(
    '同步数据至本地会覆盖当前编辑的信息，是否继续？',
    '警告',
    {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    downloadLoading.value = true
    axios.get(url + '/download', {
      params: {
        data: JSON.stringify({
          'date': getDateStr(new Date())
        })
      }
    }).then((res) => {
      downloadLoading.value = false
      if (!res.data.suc) {
        ElMessage.error(res.data.msg)
        return
      }

      studentList.value = res.data['studentList']
      selectedSet.value = new Set(res.data['selectedStudent'])
      homeworkData.value = res.data['homeworkData']
      ElMessage({ message: '数据下载同步成功', type: 'success' })
      synced.value = true

    }).catch((err) => {
      ElMessage.error(`下载失败：${err}`)
      downloadLoading.value = false
    })
  })

}
</script>
<style scoped></style>
