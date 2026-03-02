<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">校友用户管理</text>
      <text class="page-desc">管理所有注册用户及其校友状态</text>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <uni-data-select v-model="filterStatus" :localdata="statusOptions" placeholder="全部状态" @change="onFilterChange" />
      <uni-easyinput v-model="keyword" placeholder="搜索姓名/手机号" prefixIcon="search" @confirm="onSearch" />
      <button type="primary" size="mini" @click="onSearch">搜索</button>
    </view>

    <!-- 列表 -->
    <uni-table stripe emptyText="暂无数据" :loading="loading">
      <uni-tr>
        <uni-th width="100" align="center">姓名</uni-th>
        <uni-th width="70" align="center">性别</uni-th>
        <uni-th width="100" align="center">入学年份</uni-th>
        <uni-th width="100" align="center">班级</uni-th>
        <uni-th width="100" align="center">校友状态</uni-th>
        <uni-th width="130" align="center">注册时间</uni-th>
        <uni-th width="120" align="center">操作</uni-th>
      </uni-tr>
      <uni-tr v-for="item in list" :key="item._id">
        <uni-td align="center">{{ item.realName || '-' }}</uni-td>
        <uni-td align="center">{{ getGenderText(item.gender) }}</uni-td>
        <uni-td align="center">{{ getPrimaryEdu(item.educations, 'enrollmentYear') || '-' }}</uni-td>
        <uni-td align="center">{{ getPrimaryEdu(item.educations, 'className') || '-' }}</uni-td>
        <uni-td align="center">
          <uni-tag :text="getStatusText(item.alumniStatus)" :type="getStatusType(item.alumniStatus)" size="small" />
        </uni-td>
        <uni-td align="center">{{ formatDate(item.register_date) }}</uni-td>
        <uni-td align="center">
          <view class="action-btns">
            <button type="primary" size="mini" @click="viewDetail(item._id)">详情</button>
            <button type="default" size="mini" @click="changeStatus(item)">状态</button>
          </view>
        </uni-td>
      </uni-tr>
    </uni-table>

    <!-- 分页 -->
    <view class="pagination">
      <uni-pagination :total="total" :current="page" :pageSize="pageSize" @change="onPageChange" />
    </view>

    <!-- 修改状态弹窗 -->
    <uni-popup ref="statusPopup" type="dialog">
      <uni-popup-dialog type="info" title="修改校友状态" :before-close="true" @close="closeStatusPopup" @confirm="confirmStatus">
        <view class="status-content">
          <view class="status-info">
            <text>用户：{{ currentItem?.realName || '未知' }}</text>
          </view>
          <view class="status-options">
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
      loading: false,
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      filterStatus: '',
      keyword: '',
      statusOptions: [
        { value: '', text: '全部状态' },
        { value: 0, text: '未认证' },
        { value: 1, text: '已认证' },
        { value: 2, text: '已禁用' }
      ],
      currentItem: null,
      newStatus: 0
    }
  },
  onLoad() {
    this.loadList()
  },
  methods: {
    async loadList() {
      this.loading = true
      try {
        const res = await alumniAdminCo.getAlumniUserList({
          alumniStatus: this.filterStatus,
          keyword: this.keyword,
          page: this.page,
          pageSize: this.pageSize
        })
        if (res.errCode === 0) {
          this.list = res.data.list
          this.total = res.data.total
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    getPrimaryEdu(educations, field) {
      if (!educations || educations.length === 0) return null
      const local = educations.find(e => e.isLocal !== false) || educations[0]
      return local[field] || null
    },
    getGenderText(gender) {
      return { 1: '男', 2: '女' }[gender] || '未知'
    },
    onFilterChange() { this.page = 1; this.loadList() },
    onSearch() { this.page = 1; this.loadList() },
    onPageChange(e) { this.page = e.current; this.loadList() },
    viewDetail(id) { uni.navigateTo({ url: `/pages/alumni/user/detail?id=${id}` }) },
    changeStatus(item) {
      this.currentItem = item
      this.newStatus = item.alumniStatus || 0
      this.$refs.statusPopup.open()
    },
    closeStatusPopup() { this.$refs.statusPopup.close() },
    onStatusChange(e) { this.newStatus = parseInt(e.detail.value) },
    async confirmStatus() {
      try {
        const res = await alumniAdminCo.updateAlumniStatus({
          userId: this.currentItem._id,
          alumniStatus: this.newStatus
        })
        if (res.errCode === 0) {
          uni.showToast({ title: '更新成功', icon: 'success' })
          this.closeStatusPopup()
          this.loadList()
        } else {
          uni.showToast({ title: res.errMsg || '操作失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    getStatusText(status) {
      return { 0: '未认证', 1: '已认证', 2: '已禁用' }[status] || '未认证'
    },
    getStatusType(status) {
      return { 0: 'default', 1: 'success', 2: 'error' }[status] || 'default'
    },
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const d = new Date(timestamp)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
.page-header { margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: bold; color: #333; display: block; }
.page-desc { font-size: 14px; color: #999; margin-top: 8px; display: block; }
.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
}
.action-btns { display: flex; gap: 8px; justify-content: center; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.status-content { padding: 15px 0; }
.status-info { margin-bottom: 15px; color: #666; }
.status-option { display: flex; align-items: center; margin-bottom: 10px; }
.status-option text { margin-left: 8px; }
</style>
