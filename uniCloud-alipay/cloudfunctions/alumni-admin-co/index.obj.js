/**
 * alumni-admin-co - 校友会管理端云对象
 * @description 提供管理端所需的各种管理功能
 */

const db = uniCloud.database()
const dbCmd = db.command

/**
 * 生成校友卡号
 * @param {string} enrollmentYear - 入学年份
 * @param {number} sequence - 序号
 * @returns {string} 校友卡号，格式：年份+8位序号
 */
function generateAlumniCardNo(enrollmentYear, sequence) {
  const paddedSequence = String(sequence).padStart(8, '0')
  return `${enrollmentYear}${paddedSequence}`
}

module.exports = {
  _before: async function() {
    // 获取客户端信息
    this.clientInfo = this.getClientInfo()

    // 获取云端信息
    const cloudInfo = this.getCloudInfo()
    this.spaceId = cloudInfo.spaceId

    // 验证管理员身份
    const uniIdCommon = require('uni-id-common')
    const uniID = uniIdCommon.createInstance({
      clientInfo: this.clientInfo
    })

    const payload = await uniID.checkToken(this.clientInfo.uniIdToken)
    if (payload.errCode) {
      throw new Error('未登录或登录已过期')
    }

    this.uid = payload.uid
    this.userInfo = payload.userInfo

    // 检查是否有管理员权限
    const userDoc = await db.collection('uni-id-users').doc(this.uid).get()
    if (!userDoc.data || userDoc.data.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userDoc.data[0]
    const adminRoles = ['admin', 'super_admin', 'alumni_admin']
    const hasAdminRole = user.role && user.role.some(r => adminRoles.includes(r))

    if (!hasAdminRole) {
      throw new Error('无管理员权限')
    }

    this.adminUser = user
  },

  // ==================== 学校配置管理 ====================

  /**
   * 获取学校配置
   * @returns {Object} 学校配置信息
   */
  async getSchoolConfig() {
    const res = await db.collection('school-config').limit(1).get()

    if (res.data && res.data.length > 0) {
      return {
        errCode: 0,
        data: res.data[0]
      }
    }

    // 返回默认配置
    return {
      errCode: 0,
      data: {
        appName: '校友会',
        logo: '',
        branding: {
          primaryColor: '#2B5CE6',
          primaryLight: '#5B7FEF',
          slogan: '欢迎回家'
        },
        features: {
          enableVerification: true,
          enableFriendship: true,
          enableChat: true,
          enableActivity: true
        }
      }
    }
  },

  /**
   * 保存学校配置
   * @param {Object} config - 配置信息
   * @returns {Object} 操作结果
   */
  async saveSchoolConfig(config) {
    if (!config) {
      return { errCode: 1, errMsg: '配置信息不能为空' }
    }

    const now = Date.now()
    const existingConfig = await db.collection('school-config').limit(1).get()

    const configData = {
      appName: config.appName || '校友会',
      logo: config.logo || '',
      branding: {
        primaryColor: config.branding?.primaryColor || '#2B5CE6',
        primaryLight: config.branding?.primaryLight || '#5B7FEF',
        slogan: config.branding?.slogan || '欢迎回家'
      },
      features: {
        enableVerification: config.features?.enableVerification !== false,
        enableFriendship: config.features?.enableFriendship !== false,
        enableChat: config.features?.enableChat !== false,
        enableActivity: config.features?.enableActivity !== false
      },
      contact: {
        email: config.contact?.email || '',
        phone: config.contact?.phone || '',
        address: config.contact?.address || ''
      },
      update_date: now,
      update_by: this.uid
    }

    if (existingConfig.data && existingConfig.data.length > 0) {
      // 更新现有配置
      await db.collection('school-config').doc(existingConfig.data[0]._id).update(configData)
    } else {
      // 创建新配置
      configData.create_date = now
      configData.create_by = this.uid
      await db.collection('school-config').add(configData)
    }

    return { errCode: 0, errMsg: '保存成功' }
  },

  // ==================== 校友认证审核 ====================

  /**
   * 获取认证申请列表
   * @param {Object} params - 查询参数
   * @returns {Object} 认证申请列表
   */
  async getVerificationList(params = {}) {
    const { status, keyword, page = 1, pageSize = 20 } = params

    let query = db.collection('alumni-verification')

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      query = query.where({ status: parseInt(status) })
    }

    // 关键词搜索（需要联表查询用户信息）
    // 这里简化处理，先获取列表再过滤

    // 获取总数
    const countRes = await query.count()
    const total = countRes.total

    // 分页查询
    const listRes = await query
      .orderBy('create_date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取关联的用户信息
    const userIds = listRes.data.map(item => item.user_id)
    let usersMap = {}

    if (userIds.length > 0) {
      const usersRes = await db.collection('uni-id-users')
        .where({ _id: dbCmd.in(userIds) })
        .field({ nickname: true, mobile: true, avatar: true })
        .get()

      usersRes.data.forEach(user => {
        usersMap[user._id] = user
      })
    }

    // 组装数据
    const list = listRes.data.map(item => ({
      ...item,
      userInfo: usersMap[item.user_id] || {}
    }))

    return {
      errCode: 0,
      data: {
        list,
        total,
        page,
        pageSize
      }
    }
  },

  /**
   * 获取认证详情
   * @param {String} id - 认证记录ID
   * @returns {Object} 认证详情
   */
  async getVerificationDetail(id) {
    if (!id) {
      return { errCode: 1, errMsg: '参数错误' }
    }

    const res = await db.collection('alumni-verification').doc(id).get()

    if (!res.data || res.data.length === 0) {
      return { errCode: 2, errMsg: '记录不存在' }
    }

    const verification = res.data[0]

    // 获取用户信息（包含校友卡号等）
    const userRes = await db.collection('uni-id-users').doc(verification.user_id).get()
    const userInfo = userRes.data && userRes.data.length > 0 ? userRes.data[0] : {}

    return {
      errCode: 0,
      data: {
        ...verification,
        alumniCardNo: userInfo.alumniCardNo, // 添加校友卡号
        userInfo: {
          _id: userInfo._id,
          nickname: userInfo.nickname,
          mobile: userInfo.mobile,
          avatar: userInfo.avatar
        }
      }
    }
  },

  /**
   * 审核认证申请
   * @param {Object} params - 审核参数
   * @returns {Object} 操作结果
   */
  async reviewVerification(params) {
    const { id, status, rejectReason } = params

    if (!id) {
      return { errCode: 1, errMsg: '参数错误' }
    }

    if (![1, 2].includes(status)) {
      return { errCode: 2, errMsg: '状态值无效' }
    }

    const now = Date.now()

    // 获取认证记录
    const verifyRes = await db.collection('alumni-verification').doc(id).get()
    if (!verifyRes.data || verifyRes.data.length === 0) {
      return { errCode: 3, errMsg: '记录不存在' }
    }

    const verification = verifyRes.data[0]

    if (verification.status !== 0) {
      return { errCode: 4, errMsg: '该申请已被处理' }
    }

    // 更新认证记录
    const updateData = {
      status,
      review_date: now,
      reviewer_id: this.uid
    }

    if (status === 2 && rejectReason) {
      updateData.reject_reason = rejectReason
    }

    await db.collection('alumni-verification').doc(id).update(updateData)

    // 如果通过，更新用户的校友状态
    if (status === 1) {
      // 生成校友卡号
      const enrollmentYear = verification.education?.enrollmentYear || new Date().getFullYear()

      // 查询该年份最大的卡号
      const cardRes = await db.collection('uni-id-users')
        .where({
          alumniCardNo: dbCmd.exists(true),
          alumniCardNo: new RegExp(`^${enrollmentYear}`)
        })
        .orderBy('alumniCardNo', 'desc')
        .limit(1)
        .get()

      let sequence = 1
      if (cardRes.data && cardRes.data.length > 0) {
        const lastCardNo = cardRes.data[0].alumniCardNo
        const lastSequence = parseInt(lastCardNo.substring(4))
        sequence = lastSequence + 1
      }

      const alumniCardNo = generateAlumniCardNo(enrollmentYear, sequence)

      await db.collection('uni-id-users').doc(verification.user_id).update({
        alumniStatus: 1,
        alumniVerifyDate: now,
        alumniCardNo: alumniCardNo,
        realName: verification.realName,
        gender: verification.gender
      })

      // 同步更新或创建 alumni-users 记录
      const alumniUserRes = await db.collection('alumni-users')
        .where({ user_id: verification.user_id })
        .limit(1)
        .get()

      const alumniData = {
        realName: verification.realName,
        gender: verification.gender,
        primaryEducation: verification.education,
        alumniCardNo: alumniCardNo,
        update_date: now
      }

      if (alumniUserRes.data && alumniUserRes.data.length > 0) {
        await db.collection('alumni-users').doc(alumniUserRes.data[0]._id).update(alumniData)
      } else {
        alumniData.user_id = verification.user_id
        alumniData.create_date = now
        alumniData.privacySettings = {
          showRealName: true,
          showContact: false,
          showEducation: true,
          showWork: true
        }
        await db.collection('alumni-users').add(alumniData)
      }
    }

    return { errCode: 0, errMsg: status === 1 ? '审核通过' : '已拒绝' }
  },

  // ==================== 校友用户管理 ====================

  /**
   * 获取校友用户列表
   * @param {Object} params - 查询参数
   * @returns {Object} 用户列表
   */
  async getAlumniUserList(params = {}) {
    const { keyword, alumniStatus, page = 1, pageSize = 20 } = params

    let query = db.collection('uni-id-users')
    let whereCondition = {}

    // 校友状态筛选
    if (alumniStatus !== undefined && alumniStatus !== null && alumniStatus !== '') {
      whereCondition.alumniStatus = parseInt(alumniStatus)
    }

    // 关键词搜索
    if (keyword) {
      whereCondition = dbCmd.or([
        { nickname: new RegExp(keyword, 'i') },
        { mobile: new RegExp(keyword, 'i') },
        { username: new RegExp(keyword, 'i') }
      ])
    }

    if (Object.keys(whereCondition).length > 0) {
      query = query.where(whereCondition)
    }

    // 获取总数
    const countRes = await query.count()
    const total = countRes.total

    // 分页查询
    const listRes = await query
      .field({
        _id: true,
        username: true,
        nickname: true,
        mobile: true,
        avatar: true,
        alumniStatus: true,
        register_date: true,
        last_login_date: true
      })
      .orderBy('register_date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      errCode: 0,
      data: {
        list: listRes.data,
        total,
        page,
        pageSize
      }
    }
  },

  /**
   * 获取校友用户详情
   * @param {String} userId - 用户ID
   * @returns {Object} 用户详情
   */
  async getAlumniUserDetail(userId) {
    if (!userId) {
      return { errCode: 1, errMsg: '参数错误' }
    }

    // 获取基础用户信息
    const userRes = await db.collection('uni-id-users').doc(userId).get()
    if (!userRes.data || userRes.data.length === 0) {
      return { errCode: 2, errMsg: '用户不存在' }
    }

    const user = userRes.data[0]

    // 获取校友详细信息
    const alumniRes = await db.collection('alumni-users')
      .where({ user_id: userId })
      .limit(1)
      .get()

    const alumniInfo = alumniRes.data && alumniRes.data.length > 0 ? alumniRes.data[0] : null

    // 获取认证记录
    const verifyRes = await db.collection('alumni-verification')
      .where({ user_id: userId })
      .orderBy('create_date', 'desc')
      .limit(1)
      .get()

    const verificationInfo = verifyRes.data && verifyRes.data.length > 0 ? verifyRes.data[0] : null

    return {
      errCode: 0,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          nickname: user.nickname,
          mobile: user.mobile,
          email: user.email,
          avatar: user.avatar,
          alumniStatus: user.alumniStatus,
          register_date: user.register_date,
          last_login_date: user.last_login_date
        },
        alumniInfo,
        verificationInfo
      }
    }
  },

  /**
   * 更新用户校友状态
   * @param {Object} params - 参数
   * @returns {Object} 操作结果
   */
  async updateAlumniStatus(params) {
    const { userId, alumniStatus } = params

    if (!userId) {
      return { errCode: 1, errMsg: '参数错误' }
    }

    if (![0, 1, 2].includes(alumniStatus)) {
      return { errCode: 2, errMsg: '状态值无效' }
    }

    await db.collection('uni-id-users').doc(userId).update({
      alumniStatus,
      alumniStatusUpdateDate: Date.now(),
      alumniStatusUpdateBy: this.uid
    })

    return { errCode: 0, errMsg: '更新成功' }
  },

  // ==================== 数据统计 ====================

  /**
   * 获取统计概览
   * @returns {Object} 统计数据
   */
  async getStatisticsOverview() {
    const now = Date.now()
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000

    // 总用户数
    const totalUsersRes = await db.collection('uni-id-users').count()
    const totalUsers = totalUsersRes.total

    // 已认证校友数
    const verifiedUsersRes = await db.collection('uni-id-users')
      .where({ alumniStatus: 1 })
      .count()
    const verifiedUsers = verifiedUsersRes.total

    // 待审核数
    const pendingVerifyRes = await db.collection('alumni-verification')
      .where({ status: 0 })
      .count()
    const pendingVerify = pendingVerifyRes.total

    // 今日新增用户
    const todayNewUsersRes = await db.collection('uni-id-users')
      .where({ register_date: dbCmd.gte(todayStart) })
      .count()
    const todayNewUsers = todayNewUsersRes.total

    // 本周新增用户
    const weekNewUsersRes = await db.collection('uni-id-users')
      .where({ register_date: dbCmd.gte(weekStart) })
      .count()
    const weekNewUsers = weekNewUsersRes.total

    // 本月新增用户
    const monthNewUsersRes = await db.collection('uni-id-users')
      .where({ register_date: dbCmd.gte(monthStart) })
      .count()
    const monthNewUsers = monthNewUsersRes.total

    // 好友关系数
    const friendshipsRes = await db.collection('alumni-friend').count()
    const friendships = friendshipsRes.total

    return {
      errCode: 0,
      data: {
        totalUsers,
        verifiedUsers,
        pendingVerify,
        todayNewUsers,
        weekNewUsers,
        monthNewUsers,
        friendships,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0
      }
    }
  },

  /**
   * 获取用户增长趋势
   * @param {Object} params - 参数
   * @returns {Object} 趋势数据
   */
  async getUserGrowthTrend(params = {}) {
    const { days = 30 } = params
    const now = Date.now()
    const startTime = now - days * 24 * 60 * 60 * 1000

    // 获取时间范围内的用户
    const usersRes = await db.collection('uni-id-users')
      .where({ register_date: dbCmd.gte(startTime) })
      .field({ register_date: true })
      .get()

    // 按天统计
    const dailyStats = {}
    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      dailyStats[dateStr] = 0
    }

    usersRes.data.forEach(user => {
      const date = new Date(user.register_date)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      if (dailyStats[dateStr] !== undefined) {
        dailyStats[dateStr]++
      }
    })

    // 转换为数组格式
    const trend = Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .reverse()

    return {
      errCode: 0,
      data: trend
    }
  },

  /**
   * 获取入学年份分布
   * @returns {Object} 分布数据
   */
  async getEnrollmentYearDistribution() {
    const alumniRes = await db.collection('alumni-users')
      .field({ 'primaryEducation.enrollmentYear': true })
      .get()

    const distribution = {}
    alumniRes.data.forEach(alumni => {
      const year = alumni.primaryEducation?.enrollmentYear
      if (year) {
        distribution[year] = (distribution[year] || 0) + 1
      }
    })

    // 转换为数组并排序
    const result = Object.entries(distribution)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year)

    return {
      errCode: 0,
      data: result
    }
  },

  /**
   * 获取城市分布
   * @returns {Object} 分布数据
   */
  async getCityDistribution() {
    const alumniRes = await db.collection('alumni-users')
      .field({ city: true })
      .get()

    const distribution = {}
    alumniRes.data.forEach(alumni => {
      const city = alumni.city
      if (city) {
        distribution[city] = (distribution[city] || 0) + 1
      }
    })

    // 转换为数组并按数量排序
    const result = Object.entries(distribution)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // 取前20个城市

    return {
      errCode: 0,
      data: result
    }
  },

  /**
   * 获取行业分布
   * @returns {Object} 分布数据
   */
  async getIndustryDistribution() {
    const alumniRes = await db.collection('alumni-users')
      .field({ industry: true })
      .get()

    const distribution = {}
    alumniRes.data.forEach(alumni => {
      const industry = alumni.industry
      if (industry) {
        distribution[industry] = (distribution[industry] || 0) + 1
      }
    })

    // 转换为数组并按数量排序
    const result = Object.entries(distribution)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)

    return {
      errCode: 0,
      data: result
    }
  }
}
