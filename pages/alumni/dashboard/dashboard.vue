<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">校友数据概览</text>
      <text class="page-desc">校友会核心数据统计与分析</text>
    </view>

    <!-- 核心指标卡片 -->
    <view class="stats-overview">
      <view class="stat-card">
        <view class="stat-icon users">
          <uni-icons type="person-filled" size="24" color="#fff"></uni-icons>
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ stats.totalUsers || 0 }}</text>
          <text class="stat-label">注册用户</text>
        </view>
      </view>
      <view class="stat-card">
        <view class="stat-icon verified">
          <uni-icons type="auth-filled" size="24" color="#fff"></uni-icons>
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ stats.verifiedAlumni || 0 }}</text>
          <text class="stat-label">认证校友</text>
        </view>
      </view>
      <view class="stat-card">
        <view class="stat-icon pending">
          <uni-icons type="clock-filled" size="24" color="#fff"></uni-icons>
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ stats.pendingVerification || 0 }}</text>
          <text class="stat-label">待审核</text>
        </view>
      </view>
      <view class="stat-card">
        <view class="stat-icon today">
          <uni-icons type="calendar-filled" size="24" color="#fff"></uni-icons>
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ stats.todayNewUsers || 0 }}</text>
          <text class="stat-label">今日新增</text>
        </view>
      </view>
    </view>

    <!-- 图表区域 -->
    <view class="charts-row">
      <!-- 用户增长趋势 -->
      <uni-card title="用户增长趋势（近30天）" :is-shadow="false" class="chart-card">
        <view class="chart-container">
          <view v-if="growthData.length" class="simple-chart">
            <view class="chart-bars">
              <view
                v-for="(item, index) in growthData"
                :key="index"
                class="chart-bar-wrap"
              >
                <view
                  class="chart-bar"
                  :style="{ height: getBarHeight(item.count) + 'px' }"
                  :title="item.date + ': ' + item.count"
                ></view>
                <text v-if="index % 5 === 0" class="chart-label">{{ item.date.slice(5) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="no-data">暂无数据</view>
        </view>
      </uni-card>

      <!-- 入学年份分布 -->
      <uni-card title="入学年份分布" :is-shadow="false" class="chart-card">
        <view class="chart-container">
          <view v-if="enrollmentData.length" class="distribution-list">
            <view v-for="(item, index) in enrollmentData.slice(0, 8)" :key="index" class="distribution-item">
              <text class="dist-label">{{ item._id }}级</text>
              <view class="dist-bar-wrap">
                <view class="dist-bar" :style="{ width: getDistWidth(item.count, enrollmentData) + '%' }"></view>
              </view>
              <text class="dist-value">{{ item.count }}人</text>
            </view>
          </view>
          <view v-else class="no-data">暂无数据</view>
        </view>
      </uni-card>
    </view>

    <view class="charts-row">
      <!-- 城市分布 -->
      <uni-card title="城市分布 TOP10" :is-shadow="false" class="chart-card">
        <view class="chart-container">
          <view v-if="cityData.length" class="distribution-list">
            <view v-for="(item, index) in cityData.slice(0, 10)" :key="index" class="distribution-item">
              <text class="dist-label">{{ item._id || '未知' }}</text>
              <view class="dist-bar-wrap">
                <view class="dist-bar city" :style="{ width: getDistWidth(item.count, cityData) + '%' }"></view>
              </view>
              <text class="dist-value">{{ item.count }}人</text>
            </view>
          </view>
          <view v-else class="no-data">暂无数据</view>
        </view>
      </uni-card>

      <!-- 行业分布 -->
      <uni-card title="行业分布 TOP10" :is-shadow="false" class="chart-card">
        <view class="chart-container">
          <view v-if="industryData.length" class="distribution-list">
            <view v-for="(item, index) in industryData.slice(0, 10)" :key="index" class="distribution-item">
              <text class="dist-label">{{ item._id || '未知' }}</text>
              <view class="dist-bar-wrap">
                <view class="dist-bar industry" :style="{ width: getDistWidth(item.count, industryData) + '%' }"></view>
              </view>
              <text class="dist-value">{{ item.count }}人</text>
            </view>
          </view>
          <view v-else class="no-data">暂无数据</view>
        </view>
      </uni-card>
    </view>

    <!-- 快捷操作 -->
    <uni-card title="快捷操作" :is-shadow="false" class="mt-20">
      <view class="quick-actions">
        <view class="action-item" @click="navigateTo('/pages/alumni/verification/list')">
          <uni-icons type="checkbox-filled" size="32" color="#F39C12"></uni-icons>
          <text>认证审核</text>
          <uni-badge v-if="stats.pendingVerification" :text="stats.pendingVerification" type="error" />
        </view>
        <view class="action-item" @click="navigateTo('/pages/alumni/user/list')">
          <uni-icons type="contact-filled" size="32" color="#3498DB"></uni-icons>
          <text>用户管理</text>
        </view>
        <view class="action-item" @click="navigateTo('/pages/alumni/school-config/school-config')">
          <uni-icons type="gear-filled" size="32" color="#9B59B6"></uni-icons>
          <text>学校配置</text>
        </view>
      </view>
    </uni-card>
  </view>
</template>

<script>
const alumniAdminCo = uniCloud.importObject('alumni-admin-co')

export default {
  data() {
    return {
      loading: false,
      stats: {
        totalUsers: 0,
        verifiedAlumni: 0,
        pendingVerification: 0,
        todayNewUsers: 0
      },
      growthData: [],
      enrollmentData: [],
      cityData: [],
      industryData: []
    }
  },
  onLoad() {
    this.loadAllData()
  },
  methods: {
    async loadAllData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadStats(),
          this.loadGrowthTrend(),
          this.loadEnrollmentDistribution(),
          this.loadCityDistribution(),
          this.loadIndustryDistribution()
        ])
      } catch (e) {
        console.error('加载数据失败', e)
      } finally {
        this.loading = false
      }
    },
    async loadStats() {
      try {
        const res = await alumniAdminCo.getStatisticsOverview()
        if (res.errCode === 0) {
          this.stats = res.data
        }
      } catch (e) {
        console.error('加载统计数据失败', e)
      }
    },
    async loadGrowthTrend() {
      try {
        const res = await alumniAdminCo.getUserGrowthTrend({ days: 30 })
        if (res.errCode === 0) {
          this.growthData = res.data
        }
      } catch (e) {
        console.error('加载增长趋势失败', e)
      }
    },
    async loadEnrollmentDistribution() {
      try {
        const res = await alumniAdminCo.getEnrollmentYearDistribution()
        if (res.errCode === 0) {
          this.enrollmentData = res.data
        }
      } catch (e) {
        console.error('加载入学年份分布失败', e)
      }
    },
    async loadCityDistribution() {
      try {
        const res = await alumniAdminCo.getCityDistribution()
        if (res.errCode === 0) {
          this.cityData = res.data
        }
      } catch (e) {
        console.error('加载城市分布失败', e)
      }
    },
    async loadIndustryDistribution() {
      try {
        const res = await alumniAdminCo.getIndustryDistribution()
        if (res.errCode === 0) {
          this.industryData = res.data
        }
      } catch (e) {
        console.error('加载行业分布失败', e)
      }
    },
    getBarHeight(count) {
      if (!this.growthData.length) return 0
      const max = Math.max(...this.growthData.map(d => d.count))
      if (max === 0) return 0
      return Math.max(4, (count / max) * 100)
    },
    getDistWidth(count, data) {
      if (!data.length) return 0
      const max = Math.max(...data.map(d => d.count))
      if (max === 0) return 0
      return (count / max) * 100
    },
    navigateTo(url) {
      uni.navigateTo({ url })
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

.mt-20 {
  margin-top: 20px;
}

.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.users {
  background: linear-gradient(135deg, #3498DB, #2980B9);
}

.stat-icon.verified {
  background: linear-gradient(135deg, #27AE60, #229954);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #F39C12, #E67E22);
}

.stat-icon.today {
  background: linear-gradient(135deg, #9B59B6, #8E44AD);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
}

.chart-container {
  min-height: 200px;
}

.simple-chart {
  padding: 10px 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 120px;
  gap: 4px;
}

.chart-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(180deg, #3498DB, #2980B9);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
}

.chart-label {
  font-size: 10px;
  color: #999;
  margin-top: 5px;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist-label {
  width: 80px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.dist-bar-wrap {
  flex: 1;
  height: 16px;
  background-color: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.dist-bar {
  height: 100%;
  background: linear-gradient(90deg, #27AE60, #2ECC71);
  border-radius: 8px;
  transition: width 0.3s ease;
}

.dist-bar.city {
  background: linear-gradient(90deg, #3498DB, #5DADE2);
}

.dist-bar.industry {
  background: linear-gradient(90deg, #9B59B6, #BB8FCE);
}

.dist-value {
  width: 60px;
  font-size: 13px;
  color: #333;
  text-align: right;
  flex-shrink: 0;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 30px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 25px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
}

.action-item:hover {
  background-color: #f5f5f5;
}

.action-item text {
  font-size: 14px;
  color: #666;
}

.action-item .uni-badge {
  position: absolute;
  top: 5px;
  right: 5px;
}
</style>
