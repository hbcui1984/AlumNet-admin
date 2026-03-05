<template>
  <view class="uni-container">
    <uni-card v-if="activity" :is-shadow="false">
      <view class="detail-section">
        <view class="detail-item">
          <text class="label">活动标题：</text>
          <text class="value">{{ activity.title }}</text>
        </view>
        <view class="detail-item">
          <text class="label">活动类型：</text>
          <text class="value">{{ getTypeLabel(activity.type) }}</text>
        </view>
        <view class="detail-item">
          <text class="label">发起人：</text>
          <text class="value">{{ activity.organizerName || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">开始时间：</text>
          <text class="value">{{ formatTime(activity.startTime) }}</text>
        </view>
        <view class="detail-item">
          <text class="label">结束时间：</text>
          <text class="value">{{ formatTime(activity.endTime) }}</text>
        </view>
        <view class="detail-item">
          <text class="label">活动地点：</text>
          <text class="value">{{ activity.location?.name || '线上活动' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">人数限制：</text>
          <text class="value">{{ activity.maxParticipants || '不限' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">活动费用：</text>
          <text class="value">{{ activity.fee ? activity.fee + '元' : '免费' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">活动简介：</text>
          <text class="value">{{ activity.description || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">活动内容：</text>
          <text class="value">{{ activity.content || '-' }}</text>
        </view>
        <view class="detail-item">
          <text class="label">审核状态：</text>
          <uni-tag :type="getAuditStatusType(activity.auditStatus)">
            {{ getAuditStatusLabel(activity.auditStatus) }}
          </uni-tag>
        </view>
      </view>

      <view v-if="activity.auditStatus === 0" class="action-buttons">
        <button type="primary" @click="audit(1)">通过</button>
        <button type="warn" @click="audit(2)">拒绝</button>
      </view>
    </uni-card>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activityId: '',
      activity: null
    }
  },
  onLoad(options) {
    this.activityId = options.id
    this.loadDetail()
  },
  methods: {
    async loadDetail() {
      try {
        const adminCo = uniCloud.importObject('alumni-admin-co')
        const res = await adminCo.getActivityDetail({ activityId: this.activityId })
        if (res.errCode === 0) {
          this.activity = res.data
        } else {
          uni.showToast({ title: res.errMsg || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    getTypeLabel(type) {
      const map = { online: '线上', offline: '线下', hybrid: '线上+线下' }
      return map[type] || '-'
    },
    getAuditStatusLabel(status) {
      const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
      return map[status] || '-'
    },
    getAuditStatusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'error' }
      return map[status] || 'default'
    },
    formatTime(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    async audit(auditStatus) {
      const title = auditStatus === 1 ? '确认通过此活动？' : '确认拒绝此活动？'
      uni.showModal({
        title,
        success: async (res) => {
          if (res.confirm) {
            try {
              const adminCo = uniCloud.importObject('alumni-admin-co')
              const result = await adminCo.auditActivity({
                activityId: this.activityId,
                auditStatus
              })
              if (result.errCode === 0) {
                uni.showToast({ title: '操作成功', icon: 'success' })
                setTimeout(() => uni.navigateBack(), 1500)
              } else {
                uni.showToast({ title: result.errMsg, icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.detail-section {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #666;
}

.value {
  color: #333;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 10px;
  padding: 20px;
  justify-content: center;
}

.action-buttons button {
  flex: 1;
  max-width: 200px;
}
</style>
