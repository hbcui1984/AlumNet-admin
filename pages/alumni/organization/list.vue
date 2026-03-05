<template>
  <view class="uni-container">
    <uni-table ref="table" :loading="loading" border stripe emptyText="暂无数据">
      <uni-tr>
        <uni-th align="center">组织名称</uni-th>
        <uni-th align="center">类型</uni-th>
        <uni-th align="center">创建者</uni-th>
        <uni-th align="center">成员数</uni-th>
        <uni-th align="center">审核状态</uni-th>
        <uni-th align="center">创建时间</uni-th>
        <uni-th align="center">操作</uni-th>
      </uni-tr>
      <uni-tr v-for="item in dataList" :key="item._id">
        <uni-td align="center">{{ item.name }}</uni-td>
        <uni-td align="center">{{ getTypeLabel(item.type) }}</uni-td>
        <uni-td align="center">{{ item.creatorName || '-' }}</uni-td>
        <uni-td align="center">{{ item.memberCount }}</uni-td>
        <uni-td align="center">
          <uni-tag :text="getAuditStatusText(item.auditStatus)" :type="getAuditStatusType(item.auditStatus)" />
        </uni-td>
        <uni-td align="center">{{ formatTime(item.createTime) }}</uni-td>
        <uni-td align="center">
          <view class="uni-group">
            <button v-if="item.auditStatus === 0" class="uni-button-small" type="primary" size="mini" @click="audit(item, 1)">通过</button>
            <button v-if="item.auditStatus === 0" class="uni-button-small" type="warn" size="mini" @click="audit(item, 2)">拒绝</button>
          </view>
        </uni-td>
      </uni-tr>
    </uni-table>
    <view class="uni-pagination-box">
      <uni-pagination show-icon :page-size="pageSize" :current="pageNum" :total="total" @change="changePage" />
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      dataList: [],
      loading: false,
      pageNum: 1,
      pageSize: 20,
      total: 0
    }
  },
  onLoad() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const adminCo = uniCloud.importObject('alumni-admin-co')
        const res = await adminCo.getOrganizationList({
          pageNum: this.pageNum,
          pageSize: this.pageSize
        })
        if (res.errCode === 0) {
          this.dataList = res.data.list || []
          this.total = res.data.total || 0
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
    changePage(e) {
      this.pageNum = e.current
      this.loadData()
    },
    getTypeLabel(type) {
      const map = { region: '地域', industry: '行业', grade: '年级', interest: '兴趣' }
      return map[type] || ''
    },
    getAuditStatusText(status) {
      const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
      return map[status] || ''
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
    openDetail(item) {
      uni.navigateTo({ url: `/pages/alumni/organization/detail?id=${item._id}` })
    },
    async audit(item, status) {
      const title = status === 1 ? '通过审核' : '拒绝审核'
      uni.showModal({
        title,
        content: `确定要${title}吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const adminCo = uniCloud.importObject('alumni-admin-co')
              const result = await adminCo.auditOrganization({
                organizationId: item._id,
                auditStatus: status
              })
              if (result.errCode === 0) {
                uni.showToast({ title: '操作成功', icon: 'success' })
                this.loadData()
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

<style>
.uni-button-small {
  margin: 0 2px;
}
</style>
