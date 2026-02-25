<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">认证详情</text>
      <uni-tag :text="getStatusText(detail.status)" :type="getStatusType(detail.status)" />
    </view>

    <view v-if="loading" class="loading-wrap">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <template v-else>
      <!-- 用户基本信息 -->
      <uni-card title="用户信息" :is-shadow="false">
        <view class="info-row">
          <image :src="detail.userInfo?.avatar || '/static/default-avatar.png'" class="user-avatar" />
          <view class="user-basic">
            <text class="user-name">{{ detail.userInfo?.nickname || '未设置昵称' }}</text>
            <text class="user-mobile">{{ detail.userInfo?.mobile || '未绑定手机' }}</text>
          </view>
        </view>
      </uni-card>

      <!-- 认证信息 -->
      <uni-card title="认证信息" :is-shadow="false" class="mt-20">
        <view class="detail-item">
          <text class="label">真实姓名</text>
          <text class="value">{{ detail.realName || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">性别</text>
          <text class="value">{{ getGenderText(detail.gender) }}</text>
        </view>
        <view v-if="detail.idCard" class="detail-item">
          <text class="label">身份证号</text>
          <text class="value">{{ maskIdCard(detail.idCard) }}</text>
        </view>
        <view class="detail-item">
          <text class="label">学历</text>
          <text class="value">{{ getDegreeText(detail.education?.degree) }}</text>
        </view>
        <view v-if="detail.education" class="detail-item">
          <text class="label">学校名称</text>
          <text class="value">{{ detail.education.schoolName || (detail.education.isLocal ? (detail.schoolName || '本校') : '-') }}</text>
        </view>
        <view class="detail-item">
          <text class="label">入学年份</text>
          <text class="value">{{ detail.education?.enrollmentYear ? detail.education.enrollmentYear + '级' : '-' }}</text>
        </view>
        <view v-if="detail.education?.graduationYear" class="detail-item">
          <text class="label">毕业年份</text>
          <text class="value">{{ detail.education.graduationYear }}年</text>
        </view>
        <view v-if="detail.education?.college" class="detail-item">
          <text class="label">学院</text>
          <text class="value">{{ detail.education.college }}</text>
        </view>
        <view v-if="detail.education?.major" class="detail-item">
          <text class="label">专业</text>
          <text class="value">{{ detail.education.major }}</text>
        </view>
        <view v-if="detail.education?.className" class="detail-item">
          <text class="label">班级</text>
          <text class="value">{{ detail.education.className }}</text>
        </view>
        <view v-if="detail.education?.studentId" class="detail-item">
          <text class="label">学号</text>
          <text class="value">{{ detail.education.studentId }}</text>
        </view>
      </uni-card>

      <!-- 高中特有信息 -->
      <uni-card v-if="detail.classTeacher || detail.middleSchool || (detail.teachers && detail.teachers.length > 0)"
                title="高中信息" :is-shadow="false" class="mt-20">
        <view v-if="detail.classTeacher" class="detail-item">
          <text class="label">高三班主任</text>
          <text class="value">{{ detail.classTeacher }}</text>
        </view>
        <view v-if="detail.middleSchool" class="detail-item">
          <text class="label">初中毕业学校</text>
          <text class="value">{{ detail.middleSchool }}</text>
        </view>
        <view v-if="detail.teachers && detail.teachers.length > 0" class="detail-item">
          <text class="label">任课老师</text>
          <text class="value">{{ detail.teachers.join('、') }}</text>
        </view>
      </uni-card>

      <!-- 工作信息 -->
      <uni-card v-if="detail.workInfo || detail.currentCompany || detail.currentPosition || detail.city"
                title="工作信息" :is-shadow="false" class="mt-20">
        <view v-if="detail.workInfo" class="detail-item">
          <text class="label">工作单位及职务</text>
          <text class="value">{{ detail.workInfo }}</text>
        </view>
        <view v-if="detail.currentCompany" class="detail-item">
          <text class="label">当前单位</text>
          <text class="value">{{ detail.currentCompany }}</text>
        </view>
        <view v-if="detail.currentPosition" class="detail-item">
          <text class="label">当前职位</text>
          <text class="value">{{ detail.currentPosition }}</text>
        </view>
        <view v-if="detail.city" class="detail-item">
          <text class="label">现居城市</text>
          <text class="value">{{ detail.city }}</text>
        </view>
      </uni-card>

      <!-- 对母校寄语 -->
      <uni-card v-if="detail.messageToSchool" title="对母校寄语" :is-shadow="false" class="mt-20">
        <view class="message-content">
          <text>{{ detail.messageToSchool }}</text>
        </view>
      </uni-card>

      <!-- 近期照片 -->
      <uni-card v-if="detail.cardPhotoUrl" title="近期照片" :is-shadow="false" class="mt-20">
        <view class="photo-wrap">
          <image
            :src="detail.cardPhotoUrl"
            class="card-photo"
            mode="aspectFit"
            @click="previewSingle(detail.cardPhotoUrl)"
          />
        </view>
      </uni-card>

      <!-- 学历证书 -->
      <uni-card v-if="detail.diplomaUrls && detail.diplomaUrls.length > 0"
                title="学历证书" :is-shadow="false" class="mt-20">
        <view class="proof-images">
          <image
            v-for="(img, index) in detail.diplomaUrls"
            :key="index"
            :src="img"
            class="proof-image"
            mode="aspectFill"
            @click="previewImages(detail.diplomaUrls, index)"
          />
        </view>
      </uni-card>

      <!-- 证明材料 -->
      <uni-card title="证明材料" :is-shadow="false" class="mt-20">
        <view v-if="detail.verifyProof && detail.verifyProof.length > 0" class="proof-images">
          <image
            v-for="(img, index) in detail.verifyProof"
            :key="index"
            :src="img"
            class="proof-image"
            mode="aspectFill"
            @click="previewImages(detail.verifyProof, index)"
          />
        </view>
        <view v-else class="no-proof">
          <text>未上传证明材料</text>
        </view>
      </uni-card>

      <!-- 审核信息 -->
      <uni-card v-if="detail.status !== 0" title="审核信息" :is-shadow="false" class="mt-20">
        <view class="detail-item">
          <text class="label">审核结果</text>
          <uni-tag :text="getStatusText(detail.status)" :type="getStatusType(detail.status)" />
        </view>
        <view v-if="detail.alumniVerifyMethod" class="detail-item">
          <text class="label">认证方式</text>
          <text class="value">{{ getVerifyMethodText(detail.alumniVerifyMethod) }}</text>
        </view>
        <view v-if="detail.alumniCardNo" class="detail-item">
          <text class="label">校友卡号</text>
          <text class="value card-no">{{ detail.alumniCardNo }}</text>
        </view>
        <view class="detail-item">
          <text class="label">审核时间</text>
          <text class="value">{{ formatDate(detail.review_date) }}</text>
        </view>
        <view v-if="detail.status === 2" class="detail-item">
          <text class="label">拒绝原因</text>
          <text class="value reject-reason">{{ detail.reject_reason || '-' }}</text>
        </view>
      </uni-card>

      <!-- 时间信息 -->
      <uni-card title="时间信息" :is-shadow="false" class="mt-20">
        <view class="detail-item">
          <text class="label">提交时间</text>
          <text class="value">{{ formatDate(detail.create_date) }}</text>
        </view>
      </uni-card>

      <!-- 操作按钮 -->
      <view v-if="detail.status === 0" class="action-bar">
        <button type="warn" @click="rejectVerification">拒绝</button>
        <button type="primary" @click="approveVerification">通过</button>
      </view>
    </template>

    <!-- 拒绝原因弹窗 -->
    <uni-popup ref="rejectPopup" type="dialog">
      <uni-popup-dialog
        type="warn"
        title="拒绝认证"
        :before-close="true"
        @close="closeRejectPopup"
        @confirm="confirmReject"
      >
        <view class="reject-form">
          <text class="reject-tip">请输入拒绝原因，将通知申请人</text>
          <uni-easyinput type="textarea" v-model="rejectReason" placeholder="请输入拒绝原因" />
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
      rejectReason: ''
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
        const res = await alumniAdminCo.getVerificationDetail(this.id)
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
    previewSingle(url) {
      uni.previewImage({ urls: [url], current: 0 })
    },
    previewImages(urls, index) {
      uni.previewImage({ urls, current: index })
    },
    getVerifyMethodText(method) {
      const map = { admin_review: '管理员审核', recommend: '校友推荐' }
      return map[method] || method || '-'
    },
    getDegreeText(degree) {
      const map = {
        bachelor: '本科',
        master: '硕士',
        doctor: '博士',
        highschool: '高中',
        middleschool: '初中'
      }
      return map[degree] || degree || '-'
    },
    approveVerification() {
      uni.showModal({
        title: '确认通过',
        content: '确定通过该校友的认证申请吗？',
        success: async (res) => {
          if (res.confirm) {
            await this.doReview(1)
          }
        }
      })
    },
    rejectVerification() {
      this.rejectReason = ''
      this.$refs.rejectPopup.open()
    },
    closeRejectPopup() {
      this.$refs.rejectPopup.close()
    },
    async confirmReject() {
      if (!this.rejectReason.trim()) {
        uni.showToast({ title: '请输入拒绝原因', icon: 'none' })
        return
      }
      await this.doReview(2, this.rejectReason)
      this.closeRejectPopup()
    },
    async doReview(status, reason = '') {
      try {
        uni.showLoading({ title: '处理中...' })
        const res = await alumniAdminCo.reviewVerification({
          id: this.id,
          status,
          rejectReason: reason
        })
        uni.hideLoading()
        if (res.errCode === 0) {
          uni.showToast({ title: res.errMsg, icon: 'success' })
          this.loadDetail()
        } else {
          uni.showToast({ title: res.errMsg || '操作失败', icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading()
        console.error('审核失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    getGenderText(gender) {
      const map = { 1: '男', 2: '女' }
      return map[gender] || '未知'
    },
    maskIdCard(idCard) {
      if (!idCard || idCard.length < 10) return idCard
      // 显示前6位和后4位，中间用*代替
      return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
    },
    getStatusText(status) {
      const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
      return map[status] || '未知'
    },
    getStatusType(status) {
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
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
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
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.user-basic {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.user-mobile {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
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
  width: 100px;
  color: #999;
  flex-shrink: 0;
}

.detail-item .value {
  flex: 1;
  color: #333;
}

.detail-item .reject-reason {
  color: #E74C3C;
}

.detail-item .card-no {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #2E5C8A;
  letter-spacing: 1px;
}

.message-content {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  line-height: 1.6;
  color: #666;
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

.photo-wrap {
  display: flex;
}

.card-photo {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  cursor: pointer;
}

.no-proof {
  color: #999;
  text-align: center;
  padding: 20px;
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

.reject-form {
  padding: 10px 0;
}

.reject-tip {
  display: block;
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
}
</style>
