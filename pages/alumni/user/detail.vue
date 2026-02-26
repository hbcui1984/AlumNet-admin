<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">用户详情</text>
    </view>

    <view v-if="loading" class="loading-wrap">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <template v-else>
      <!-- 基本信息 -->
      <uni-card title="基本信息" :is-shadow="false">
        <view class="info-row">
          <image :src="detail.user?.avatar || '/static/default-avatar.png'" class="user-avatar" />
          <view class="user-basic">
            <text class="user-name">{{ detail.user?.nickname || '未设置昵称' }}</text>
            <uni-tag :text="getStatusText(detail.user?.alumniStatus)" :type="getStatusType(detail.user?.alumniStatus)" size="small" />
          </view>
        </view>
        <view class="detail-item">
          <text class="label">用户ID</text>
          <text class="value">{{ detail.user?._id || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">用户名</text>
          <text class="value">{{ detail.user?.username || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">手机号</text>
          <text class="value">{{ detail.user?.mobile || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">邮箱</text>
          <text class="value">{{ detail.user?.email || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">注册时间</text>
          <text class="value">{{ formatDate(detail.user?.register_date) }}</text>
        </view>
        <view class="detail-item">
          <text class="label">最后登录</text>
          <text class="value">{{ formatDate(detail.user?.last_login_date) }}</text>
        </view>
      </uni-card>

      <!-- 校友信息 -->
      <uni-card v-if="detail.alumniInfo" title="校友信息" :is-shadow="false" class="mt-20">
        <view class="detail-item">
          <text class="label">真实姓名</text>
          <text class="value">{{ detail.alumniInfo.realName || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">性别</text>
          <text class="value">{{ getGenderText(detail.alumniInfo.gender) }}</text>
        </view>
        <view v-if="detail.alumniInfo.idCard" class="detail-item">
          <text class="label">身份证号</text>
          <text class="value">{{ maskIdCard(detail.alumniInfo.idCard) }}</text>
        </view>
        <view v-if="detail.alumniInfo.alumniCardNo" class="detail-item">
          <text class="label">校友卡号</text>
          <text class="value card-no">{{ detail.alumniInfo.alumniCardNo }}</text>
        </view>
        <view v-if="detail.alumniInfo.alumniVerifyMethod" class="detail-item">
          <text class="label">认证方式</text>
          <text class="value">{{ getVerifyMethodText(detail.alumniInfo.alumniVerifyMethod) }}</text>
        </view>
      </uni-card>

      <!-- 本校学历 -->
      <uni-card v-if="detail.alumniInfo && localEducations.length > 0"
                title="本校学历" :is-shadow="false" class="mt-20">
        <view v-for="(edu, index) in localEducations" :key="index" class="edu-item">
          <view class="edu-header">
            <text class="edu-degree-tag">{{ getDegreeText(edu.degree) }}</text>
            <text v-if="index === 0" class="edu-primary-tag">主要</text>
          </view>
          <view class="detail-item">
            <text class="label">入学年份</text>
            <text class="value">{{ edu.enrollmentYear ? edu.enrollmentYear + '级' : '-' }}</text>
          </view>
          <view v-if="edu.graduationYear" class="detail-item">
            <text class="label">毕业年份</text>
            <text class="value">{{ edu.graduationYear }}年</text>
          </view>
          <view v-if="edu.college" class="detail-item">
            <text class="label">学院</text>
            <text class="value">{{ edu.college }}</text>
          </view>
          <view v-if="edu.major" class="detail-item">
            <text class="label">专业</text>
            <text class="value">{{ edu.major }}</text>
          </view>
          <view v-if="edu.className" class="detail-item">
            <text class="label">班级</text>
            <text class="value">{{ edu.className }}</text>
          </view>
          <view v-if="edu.headTeacher" class="detail-item">
            <text class="label">班主任</text>
            <text class="value">{{ edu.headTeacher }}</text>
          </view>
          <view v-if="edu.middleSchool" class="detail-item">
            <text class="label">初中毕业学校</text>
            <text class="value">{{ edu.middleSchool }}</text>
          </view>
          <view v-if="edu.teachers" class="detail-item">
            <text class="label">任课老师</text>
            <text class="value">{{ edu.teachers }}</text>
          </view>
          <view v-if="edu.studentId" class="detail-item">
            <text class="label">学号</text>
            <text class="value">{{ edu.studentId }}</text>
          </view>
        </view>
      </uni-card>

      <!-- 其他学历 -->
      <uni-card v-if="detail.alumniInfo && otherEducations.length > 0"
                title="其他学历" :is-shadow="false" class="mt-20">
        <view v-for="(edu, index) in otherEducations" :key="index" class="edu-item">
          <view class="edu-header">
            <text class="edu-degree-tag">{{ getDegreeText(edu.degree) }}</text>
            <text class="edu-school-name">{{ edu.schoolName }}</text>
          </view>
          <view class="detail-item">
            <text class="label">入学年份</text>
            <text class="value">{{ edu.enrollmentYear ? edu.enrollmentYear + '级' : '-' }}</text>
          </view>
          <view v-if="edu.graduationYear" class="detail-item">
            <text class="label">毕业年份</text>
            <text class="value">{{ edu.graduationYear }}年</text>
          </view>
          <view v-if="edu.college" class="detail-item">
            <text class="label">学院</text>
            <text class="value">{{ edu.college }}</text>
          </view>
          <view v-if="edu.major" class="detail-item">
            <text class="label">专业</text>
            <text class="value">{{ edu.major }}</text>
          </view>
        </view>
      </uni-card>

      <!-- 工作与生活信息 -->
      <uni-card v-if="detail.alumniInfo && (detail.alumniInfo.workInfo || detail.alumniInfo.currentCompany || detail.alumniInfo.currentPosition || detail.alumniInfo.city || detail.alumniInfo.industry)"
                title="工作与生活" :is-shadow="false" class="mt-20">
        <view v-if="detail.alumniInfo.workInfo" class="detail-item">
          <text class="label">工作单位及职务</text>
          <text class="value">{{ detail.alumniInfo.workInfo }}</text>
        </view>
        <view v-if="detail.alumniInfo.currentCompany" class="detail-item">
          <text class="label">当前公司</text>
          <text class="value">{{ detail.alumniInfo.currentCompany }}</text>
        </view>
        <view v-if="detail.alumniInfo.currentPosition" class="detail-item">
          <text class="label">当前职位</text>
          <text class="value">{{ detail.alumniInfo.currentPosition }}</text>
        </view>
        <view v-if="detail.alumniInfo.city" class="detail-item">
          <text class="label">所在城市</text>
          <text class="value">{{ detail.alumniInfo.city }}</text>
        </view>
        <view v-if="detail.alumniInfo.industry" class="detail-item">
          <text class="label">行业</text>
          <text class="value">{{ detail.alumniInfo.industry }}</text>
        </view>
      </uni-card>

      <!-- 近期照片 -->
      <uni-card v-if="detail.alumniInfo && detail.alumniInfo.cardPhotoUrl"
                title="近期照片" :is-shadow="false" class="mt-20">
        <view class="photo-wrap">
          <image
            :src="detail.alumniInfo.cardPhotoUrl"
            class="card-photo"
            mode="aspectFit"
            @click="previewSingle(detail.alumniInfo.cardPhotoUrl)"
          />
        </view>
      </uni-card>

      <!-- 学历证书 -->
      <uni-card v-if="detail.alumniInfo && detail.alumniInfo.diplomaUrls && detail.alumniInfo.diplomaUrls.length > 0"
                title="学历证书" :is-shadow="false" class="mt-20">
        <view class="proof-images">
          <image
            v-for="(img, index) in detail.alumniInfo.diplomaUrls"
            :key="index"
            :src="img"
            class="proof-image"
            mode="aspectFill"
            @click="previewImages(detail.alumniInfo.diplomaUrls, index)"
          />
        </view>
      </uni-card>

      <!-- 证明材料 -->
      <uni-card v-if="detail.alumniInfo && detail.alumniInfo.verifyProof && detail.alumniInfo.verifyProof.length > 0"
                title="证明材料" :is-shadow="false" class="mt-20">
        <view class="proof-images">
          <image
            v-for="(img, index) in detail.alumniInfo.verifyProof"
            :key="index"
            :src="img"
            class="proof-image"
            mode="aspectFill"
            @click="previewImages(detail.alumniInfo.verifyProof, index)"
          />
        </view>
      </uni-card>

      <!-- 对母校寄语 -->
      <uni-card v-if="detail.alumniInfo && detail.alumniInfo.messageToSchool"
                title="对母校寄语" :is-shadow="false" class="mt-20">
        <view class="message-content">
          <text>{{ detail.alumniInfo.messageToSchool }}</text>
        </view>
      </uni-card>

      <!-- 认证记录 -->
      <uni-card v-if="detail.verificationInfo" title="认证记录" :is-shadow="false" class="mt-20">
        <view class="detail-item">
          <text class="label">认证状态</text>
          <uni-tag :text="getVerifyStatusText(detail.verificationInfo.status)" :type="getVerifyStatusType(detail.verificationInfo.status)" size="small" />
        </view>
        <view v-if="detail.verificationInfo.alumniVerifyMethod" class="detail-item">
          <text class="label">认证方式</text>
          <text class="value">{{ getVerifyMethodText(detail.verificationInfo.alumniVerifyMethod) }}</text>
        </view>
        <view class="detail-item">
          <text class="label">提交时间</text>
          <text class="value">{{ formatDate(detail.verificationInfo.create_date) }}</text>
        </view>
        <view v-if="detail.verificationInfo.status !== 0" class="detail-item">
          <text class="label">审核时间</text>
          <text class="value">{{ formatDate(detail.verificationInfo.review_date) }}</text>
        </view>
        <view v-if="detail.verificationInfo.status === 2" class="detail-item">
          <text class="label">拒绝原因</text>
          <text class="value reject">{{ detail.verificationInfo.reject_reason || '-' }}</text>
        </view>
      </uni-card>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <button type="default" @click="goBack">返回</button>
        <button type="primary" @click="changeStatus">修改状态</button>
      </view>
    </template>

    <!-- 修改状态弹窗 -->
    <uni-popup ref="statusPopup" type="dialog">
      <uni-popup-dialog type="info" title="修改校友状态" :before-close="true" @close="closeStatusPopup" @confirm="confirmStatus">
        <view class="status-content">
          <radio-group @change="onStatusChange">
            <label class="status-option">
              <radio value="0" :checked="newStatus === 0" />
              <text>未认证</text>
            </label>
            <label class="status-option">
              <radio value="1" :checked="newStatus === 1" color="#27AE60" />
              <text>已认证</text>
            </label>
            <label class="status-option">
              <radio value="2" :checked="newStatus === 2" color="#E74C3C" />
              <text>已禁用</text>
            </label>
          </radio-group>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
const alumniAdminCo = uniCloud.importObject('alumni-admin-co')

export default {
  data() {
    return {
      id: '',
      loading: false,
      detail: {},
      newStatus: 0
    }
  },
  computed: {
    localEducations() {
      const educations = this.detail.alumniInfo?.educations || []
      return educations.filter(e => e.isLocal !== false)
    },
    otherEducations() {
      const educations = this.detail.alumniInfo?.educations || []
      return educations.filter(e => e.isLocal === false)
    }
  },
  onLoad(options) {
    this.id = options.id
    if (this.id) {
      this.loadDetail()
    }
  },
  methods: {
    async loadDetail() {
      this.loading = true
      try {
        const res = await alumniAdminCo.getAlumniUserDetail(this.id)
        if (res.errCode === 0) {
          this.detail = res.data
        } else {
          uni.showToast({ title: res.errMsg || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载详情失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    goBack() {
      uni.navigateBack()
    },
    changeStatus() {
      this.newStatus = this.detail.user?.alumniStatus || 0
      this.$refs.statusPopup.open()
    },
    closeStatusPopup() {
      this.$refs.statusPopup.close()
    },
    onStatusChange(e) {
      this.newStatus = parseInt(e.detail.value)
    },
    async confirmStatus() {
      try {
        const res = await alumniAdminCo.updateAlumniStatus({
          userId: this.id,
          alumniStatus: this.newStatus
        })
        if (res.errCode === 0) {
          uni.showToast({ title: '更新成功', icon: 'success' })
          this.closeStatusPopup()
          this.loadDetail()
        } else {
          uni.showToast({ title: res.errMsg || '操作失败', icon: 'none' })
        }
      } catch (e) {
        console.error('更新状态失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    previewSingle(url) {
      uni.previewImage({ urls: [url], current: 0 })
    },
    previewImages(urls, index) {
      uni.previewImage({ urls, current: index })
    },
    maskIdCard(idCard) {
      if (!idCard || idCard.length < 10) return idCard
      return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
    },
    getDegreeText(degree) {
      const map = {
        bachelor: '本科',
        master: '硕士',
        doctor: '博士',
        highschool: '高中',
        middleschool: '初中'
      }
      return map[degree] || degree || '未知学历'
    },
    getVerifyMethodText(method) {
      const map = { admin_review: '管理员审核', recommend: '校友推荐' }
      return map[method] || method || '-'
    },
    getGenderText(gender) {
      const map = { 1: '男', 2: '女' }
      return map[gender] || '未知'
    },
    getStatusText(status) {
      const map = { 0: '未认证', 1: '已认证', 2: '已禁用' }
      return map[status] || '未认证'
    },
    getStatusType(status) {
      const map = { 0: 'default', 1: 'success', 2: 'error' }
      return map[status] || 'default'
    },
    getVerifyStatusText(status) {
      const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
      return map[status] || '未知'
    },
    getVerifyStatusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'error' }
      return map[status] || 'default'
    },
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
}

.mt-20 {
  margin-top: 20px;
}

.loading-wrap {
  padding: 50px 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.user-basic {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.detail-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  width: 120px;
  color: #999;
  flex-shrink: 0;
}

.detail-item .value {
  flex: 1;
  color: #333;
}

.detail-item .value.reject {
  color: #E74C3C;
}

.detail-item .card-no {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #2E5C8A;
  letter-spacing: 1px;
}

.edu-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.edu-item:last-child {
  border-bottom: none;
}

.edu-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.edu-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.edu-item .detail-item {
  padding: 6px 0;
}

.photo-wrap {
  display: flex;
  justify-content: center;
}

.card-photo {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  cursor: pointer;
}

.proof-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.proof-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
}

.message-content {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  line-height: 1.6;
  color: #666;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.status-content {
  padding: 15px 0;
}

.status-option {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.status-option text {
  margin-left: 8px;
}

.edu-degree-tag {
  font-size: 13px;
  font-weight: bold;
  color: #2B5CE6;
  background-color: rgba(43, 92, 230, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.edu-primary-tag {
  font-size: 12px;
  color: #fff;
  background-color: #F39C12;
  padding: 2px 6px;
  border-radius: 4px;
}

.edu-school-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
</style>
