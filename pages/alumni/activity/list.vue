<template>
  <view class="uni-container">
    <uni-card :is-shadow="false" is-full>
      <text class="uni-title">活动审核</text>
    </uni-card>

    <view class="uni-container">
      <uni-table ref="table" :loading="loading" border stripe emptyText="暂无数据">
        <uni-tr>
          <uni-th align="center">活动标题</uni-th>
          <uni-th align="center">发起人</uni-th>
          <uni-th align="center">活动类型</uni-th>
          <uni-th align="center">开始时间</uni-th>
          <uni-th align="center" width="100">审核状态</uni-th>
          <uni-th align="center" width="200">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item, index) in dataList" :key="index">
          <uni-td>{{ item.title }}</uni-td>
          <uni-td align="center">{{ item.organizerName || '-' }}</uni-td>
          <uni-td align="center">{{ getTypeLabel(item.type) }}</uni-td>
          <uni-td align="center">{{ formatTime(item.startTime) }}</uni-td>
          <uni-td align="center">
            <uni-tag :type="getAuditStatusType(item.auditStatus)">
              {{ getAuditStatusLabel(item.auditStatus) }}
            </uni-tag>
          </uni-td>
          <uni-td align="center">
            <view class="uni-group">
              <button class="uni-button-view" size="mini" type="primary" @click="viewDetail(item)">查看</button>
              <button v-if="item.auditStatus === 0" class="uni-button-audit" size="mini" type="primary" @click="audit(item, 1)">通过</button>
              <button v-if="item.auditStatus === 0" class="uni-button-reject" size="mini" type="warn" @click="audit(item, 2)">拒绝</button>
            </view>
          </uni-td>
        </uni-tr>
      </uni-table>
      <view class="uni-pagination-box">
        <uni-pagination show-icon :page-size="pagination.pageSize" :current="pagination.current" :total="pagination.total" @change="onPageChange" />
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      loading: false,
      dataList: [],
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0
      }
    }
  },
  onLoad() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const { current, pageSize } = this.pagination

        const adminCo = uniCloud.importObject('alumni-admin-co')
        const res = await adminCo.getActivityList({
          pageNum: current,
          pageSize: pageSize
        })

        if (res.errCode === 0) {
          this.dataList = res.data.list || []
          this.pagination.total = res.data.total || 0
          console.log('活动列表数据:', this.dataList)
        } else {
          uni.showToast({ title: res.errMsg || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    onPageChange(e) {
      this.pagination.current = e.current
      this.loadData()
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
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    viewDetail(item) {
      uni.navigateTo({
        url: `/pages/alumni/activity/detail?id=${item._id}`
      })
    },
    async audit(item, auditStatus) {
      const title = auditStatus === 1 ? '确认通过此活动？' : '确认拒绝此活动？'
      uni.showModal({
        title,
        content: auditStatus === 2 ? '可在下一步填写拒绝原因' : '',
        success: async (res) => {
          if (res.confirm) {
            if (auditStatus === 2) {
              this.showRejectRemark(item)
            } else {
              this.doAudit(item._id, auditStatus)
            }
          }
        }
      })
    },
    showRejectRemark(item) {
      uni.showModal({
        title: '拒绝原因',
        editable: true,
        placeholderText: '请输入拒绝原因',
        success: (res) => {
          if (res.confirm) {
            this.doAudit(item._id, 2, res.content)
          }
        }
      })
    },
    async doAudit(activityId, auditStatus, auditRemark) {
      uni.showLoading({ title: '处理中' })
      try {
        const adminCo = uniCloud.importObject('alumni-admin-co')
        await adminCo.auditActivity({ activityId, auditStatus, auditRemark })
        uni.hideLoading()
        uni.showToast({ title: '操作成功', icon: 'success' })
        this.loadData()
      } catch (e) {
        uni.hideLoading()
        console.error('审核失败', e)
        uni.showToast({ title: e.errMsg || '操作失败', icon: 'none' })
      }
    }
  }
}
</script>

<style>
.uni-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.uni-button-view {
  padding: 4px 12px;
}
.uni-button-audit {
  padding: 4px 12px;
}
.uni-button-reject {
  padding: 4px 12px;
}
</style>
