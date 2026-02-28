<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">认证审核</text>
      <text class="page-desc">审核校友提交的认证申请</text>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <uni-data-select v-model="filterStatus" :localdata="statusOptions" placeholder="全部状态" @change="onFilterChange" />
      <uni-easyinput v-model="keyword" placeholder="搜索姓名/手机号" prefixIcon="search" @confirm="onSearch" />
      <button type="primary" size="mini" @click="onSearch">搜索</button>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card pending">
        <text class="stat-value">{{ stats.pending || 0 }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-card approved">
        <text class="stat-value">{{ stats.approved || 0 }}</text>
        <text class="stat-label">已通过</text>
      </view>
      <view class="stat-card rejected">
        <text class="stat-value">{{ stats.rejected || 0 }}</text>
        <text class="stat-label">已拒绝</text>
      </view>
    </view>

    <!-- 列表 -->
    <uni-table stripe emptyText="暂无数据" :loading="loading">
      <uni-tr>
        <uni-th width="100" align="center">姓名</uni-th>
        <uni-th width="80" align="center">性别</uni-th>
        <uni-th align="left">学历信息</uni-th>
        <uni-th width="100" align="center">状态</uni-th>
        <uni-th width="150" align="center">提交时间</uni-th>
        <uni-th width="120" align="center">操作</uni-th>
      </uni-tr>
      <uni-tr v-for="item in list" :key="item._id">
        <uni-td align="center">{{ item.realName || '-' }}</uni-td>
        <uni-td align="center">{{ getGenderText(item.gender) }}</uni-td>
        <uni-td align="left">{{ getEduSummary(item.educations) }}</uni-td>
        <uni-td align="center">
          <uni-tag :text="getStatusText(item.status)" :type="getStatusType(item.status)" size="small" />
        </uni-td>
        <uni-td align="center">{{ formatDate(item.create_date) }}</uni-td>
        <uni-td align="center">
          <view class="action-btns">
            <button type="primary" size="mini" @click="viewDetail(item._id)">查看</button>
            <button v-if="item.status === 0" type="warn" size="mini" @click="quickReview(item)">审核</button>
          </view>
        </uni-td>
      </uni-tr>
    </uni-table>

    <!-- 分页 -->
    <view class="pagination">
      <uni-pagination :total="total" :current="page" :pageSize="pageSize" @change="onPageChange" />
    </view>

    <!-- 快速审核弹窗 -->
    <uni-popup ref="reviewPopup" type="dialog">
      <uni-popup-dialog type="info" title="审核认证" :before-close="true" @close="closeReviewPopup" @confirm="confirmReview">
        <view class="review-content">
          <view class="review-info">
            <text>申请人：{{ currentItem?.realName }}</text>
            <text>学历：{{ getEduSummary(currentItem?.educations) }}</text>
          </view>
          <view class="review-actions">
            <radio-group @change="onReviewChange">
              <label class="review-option">
                <radio value="1" :checked="reviewStatus === 1" color="#27AE60" />
                <text>通过</text>
              </label>
              <label class="review-option">
                <radio value="2" :checked="reviewStatus === 2" color="#E74C3C" />
                <text>拒绝</text>
              </label>
            </radio-group>
          </view>
          <view v-if="reviewStatus === 2" class="reject-reason">
            <uni-easyinput type="textarea" v-model="rejectReason" placeholder="请输入拒绝原因" />
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
const alumniAdminCo = uniCloud.importObject('alumni-admin-co')

const DEGREE_TEXT = { bachelor: '本科', master: '硕士', doctor: '博士', highschool: '高中', middleschool: '初中' }

export default {
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      filterStatus: '',
      keyword: '',
      stats: { pending: 0, approved: 0, rejected: 0 },
      statusOptions: [
        { value: '', text: '全部状态' },
        { value: 0, text: '待审核' },
        { value: 1, text: '已通过' },
        { value: 2, text: '已拒绝' }
      ],
      currentItem: null,
      reviewStatus: 1,
      rejectReason: ''
    }
  },
  onLoad() {
    this.loadList()
  },
  methods: {
    async loadList() {
      this.loading = true
      try {
        const res = await alumniAdminCo.getVerificationList({
          status: this.filterStatus,
          keyword: this.keyword,
          page: this.page,
          pageSize: this.pageSize
        })
        if (res.errCode === 0) {
          this.list = res.data.list
          this.total = res.data.total
          this.updateStats()
        }
      } catch (e) {
        console.error('加载列表失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    updateStats() {
      const pending = this.list.filter(i => i.status === 0).length
      const approved = this.list.filter(i => i.status === 1).length
      const rejected = this.list.filter(i => i.status === 2).length
      this.stats = { pending, approved, rejected }
    },
    onFilterChange() {
      this.page = 1
      this.loadList()
    },
    onSearch() {
      this.page = 1
      this.loadList()
    },
    onPageChange(e) {
      this.page = e.current
      this.loadList()
    },
    viewDetail(id) {
      uni.navigateTo({ url: `/pages/alumni/verification/detail?id=${id}` })
    },
    quickReview(item) {
      this.currentItem = item
      this.reviewStatus = 1
      this.rejectReason = ''
      this.$refs.reviewPopup.open()
    },
    closeReviewPopup() {
      this.$refs.reviewPopup.close()
    },
    onReviewChange(e) {
      this.reviewStatus = parseInt(e.detail.value)
    },
    async confirmReview() {
      if (this.reviewStatus === 2 && !this.rejectReason.trim()) {
        uni.showToast({ title: '请输入拒绝原因', icon: 'none' })
        return
      }
      try {
        const res = await alumniAdminCo.reviewVerification({
          id: this.currentItem._id,
          status: this.reviewStatus,
          rejectReason: this.rejectReason
        })
        if (res.errCode === 0) {
          uni.showToast({ title: res.errMsg, icon: 'success' })
          this.closeReviewPopup()
          this.loadList()
        } else {
          uni.showToast({ title: res.errMsg || '操作失败', icon: 'none' })
        }
      } catch (e) {
        console.error('审核失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    getEduSummary(educations) {
      if (!educations || educations.length === 0) return '-'
      const local = educations.find(e => e.isLocal !== false) || educations[0]
      const parts = [DEGREE_TEXT[local.degree] || local.degree]
      if (local.enrollmentYear) parts.push(local.enrollmentYear + '级')
      if (local.className) parts.push(local.className + '班')
      else if (local.college) parts.push(local.college)
      if (local.major) parts.push(local.major)
      const localCount = educations.filter(e => e.isLocal !== false).length
      if (localCount > 1) parts.push(`等${localCount}个学历`)
      return parts.join(' · ')
    },
    getGenderText(gender) {
      const map = { 1: '男', 2: '女' }
      return map[gender] || '未知'
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
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
}

.page-desc {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
  display: block;
}

.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
}

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  background-color: #fff;
}

.stat-card.pending {
  border-left: 4px solid #F39C12;
}

.stat-card.approved {
  border-left: 4px solid #27AE60;
}

.stat-card.rejected {
  border-left: 4px solid #E74C3C;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
  display: block;
}

.action-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.review-content {
  padding: 15px 0;
}

.review-info {
  margin-bottom: 15px;
}

.review-info text {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.review-actions {
  margin-bottom: 15px;
}

.review-option {
  display: inline-flex;
  align-items: center;
  margin-right: 30px;
}

.review-option text {
  margin-left: 5px;
}

.reject-reason {
  margin-top: 15px;
}
</style>
