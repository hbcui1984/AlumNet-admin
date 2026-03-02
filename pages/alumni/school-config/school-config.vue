<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">学校配置</text>
      <text class="page-desc">配置校友会基本信息、认证规则和功能开关，用户端将实时读取这些配置</text>
    </view>

    <uni-forms ref="configForm" :modelValue="formData" :rules="rules" label-width="120px">
      <!-- 基本信息 -->
      <uni-card title="基本信息" :is-shadow="false">
        <uni-forms-item label="学校名称" name="name" required>
          <uni-easyinput v-model="formData.name" placeholder="请输入学校全称，如：北京航空航天大学" />
        </uni-forms-item>

        <uni-forms-item label="应用名称" name="appName" required>
          <uni-easyinput v-model="formData.appName" placeholder="请输入小程序名称，如：北航校友会" />
        </uni-forms-item>

        <uni-forms-item label="学校类型" name="type" required>
          <picker :value="schoolTypeIndex" :range="schoolTypeOptions" range-key="label" @change="onSchoolTypeChange">
            <view class="picker-value">
              {{ currentSchoolTypeLabel }}
              <uni-icons type="arrowright" size="14" color="#999"></uni-icons>
            </view>
          </picker>
          <text class="field-desc">决定认证表单的结构和本校学历范围</text>
        </uni-forms-item>

        <uni-forms-item label="Logo" name="logo">
          <view class="logo-upload">
            <image v-if="formData.logo" :src="formData.logo" class="logo-preview" mode="aspectFit" @click="previewLogo" />
            <view v-else class="logo-placeholder" @click="uploadLogo">
              <uni-icons type="plusempty" size="40" color="#ccc"></uni-icons>
              <text>上传Logo</text>
            </view>
            <view class="logo-actions">
              <button type="primary" size="mini" @click="uploadLogo">{{ formData.logo ? '更换' : '上传' }}</button>
              <button v-if="formData.logo" type="default" size="mini" @click="removeLogo">移除</button>
            </view>
          </view>
        </uni-forms-item>

        <uni-forms-item label="标语" name="branding.slogan">
          <uni-easyinput v-model="formData.branding.slogan" placeholder="请输入标语，如：欢迎回家" />
        </uni-forms-item>
      </uni-card>

      <!-- 认证配置 -->
      <uni-card title="认证配置" :is-shadow="false" class="mt-20">
        <uni-forms-item label="本校学历" name="localDegrees" required>
          <view class="checkbox-group">
            <label v-for="d in degreeOptions" :key="d.value" class="checkbox-label">
              <checkbox
                :value="d.value"
                :checked="formData.localDegrees.includes(d.value)"
                @click="toggleLocalDegree(d.value)"
                color="#2B5CE6"
              />
              <text>{{ d.label }}</text>
            </label>
          </view>
          <text class="field-desc">用户认证时，勾选的学历类型默认为"本校"，可切换为其他学校</text>
        </uni-forms-item>

        <uni-forms-item label="需上传证明材料">
          <switch :checked="formData.features.requireProof" @change="e => formData.features.requireProof = e.detail.value" />
          <text class="switch-desc">开启后用户必须上传学生证等证明材料</text>
        </uni-forms-item>
      </uni-card>

      <!-- 学院专业配置（仅大学类型） -->
      <uni-card v-if="formData.type === 'university'" title="学院 / 专业配置" :is-shadow="false" class="mt-20">
        <text class="field-desc mb-10">配置后，用户认证时可通过下拉选择学院和专业</text>

        <view v-for="(college, ci) in formData.colleges" :key="ci" class="college-item">
          <view class="college-header">
            <uni-easyinput v-model="college.name" placeholder="学院名称" class="college-name-input" />
            <view class="college-actions">
              <button type="default" size="mini" @click="addMajor(ci)">+ 专业</button>
              <button type="warn" size="mini" @click="removeCollege(ci)">删除</button>
            </view>
          </view>
          <view class="major-list">
            <view v-for="(major, mi) in college.majors" :key="mi" class="major-item">
              <uni-easyinput v-model="college.majors[mi]" placeholder="专业名称" />
              <uni-icons type="closeempty" size="18" color="#999" @click="removeMajor(ci, mi)" class="major-delete" />
            </view>
          </view>
        </view>

        <button type="default" @click="addCollege" class="add-college-btn">+ 添加学院</button>
      </uni-card>

      <!-- 品牌样式 -->
      <uni-card title="品牌样式" :is-shadow="false" class="mt-20">
        <uni-forms-item label="主题色" name="branding.primaryColor">
          <view class="color-picker-wrap">
            <input type="color" v-model="formData.branding.primaryColor" class="color-input" />
            <uni-easyinput v-model="formData.branding.primaryColor" placeholder="#2B5CE6" class="color-text" />
            <view class="color-preview" :style="{ backgroundColor: formData.branding.primaryColor }"></view>
          </view>
        </uni-forms-item>

        <uni-forms-item label="主题色(浅)" name="branding.primaryLight">
          <view class="color-picker-wrap">
            <input type="color" v-model="formData.branding.primaryLight" class="color-input" />
            <uni-easyinput v-model="formData.branding.primaryLight" placeholder="#5B7FEF" class="color-text" />
            <view class="color-preview" :style="{ backgroundColor: formData.branding.primaryLight }"></view>
          </view>
        </uni-forms-item>

        <uni-forms-item label="预览效果">
          <view class="theme-preview" :style="{ '--preview-primary': formData.branding.primaryColor, '--preview-light': formData.branding.primaryLight }">
            <view class="preview-header">
              <text class="preview-title">{{ formData.appName || '校友会' }}</text>
              <text class="preview-slogan">{{ formData.branding.slogan || '欢迎回家' }}</text>
            </view>
            <view class="preview-btn">示例按钮</view>
          </view>
        </uni-forms-item>
      </uni-card>

      <!-- 功能开关 -->
      <uni-card title="功能开关" :is-shadow="false" class="mt-20">
        <uni-forms-item label="校友认证">
          <switch :checked="formData.features.enableVerification" @change="e => formData.features.enableVerification = e.detail.value" />
          <text class="switch-desc">开启后用户需要提交认证才能使用完整功能</text>
        </uni-forms-item>

        <uni-forms-item label="好友功能">
          <switch :checked="formData.features.enableFriendship" @change="e => formData.features.enableFriendship = e.detail.value" />
          <text class="switch-desc">开启后校友可以互相添加好友</text>
        </uni-forms-item>

        <uni-forms-item label="即时聊天">
          <switch :checked="formData.features.enableChat" @change="e => formData.features.enableChat = e.detail.value" />
          <text class="switch-desc">开启后好友之间可以发送消息</text>
        </uni-forms-item>

        <uni-forms-item label="校友活动">
          <switch :checked="formData.features.enableActivity" @change="e => formData.features.enableActivity = e.detail.value" />
          <text class="switch-desc">开启后可以发布和管理校友活动</text>
        </uni-forms-item>

        <uni-forms-item label="校友推荐认证">
          <switch :checked="formData.features.enableRecommendVerify" @change="e => formData.features.enableRecommendVerify = e.detail.value" />
          <text class="switch-desc">开启后，已认证校友可以推荐他人，推荐数达标自动通过认证</text>
        </uni-forms-item>

        <uni-forms-item v-if="formData.features.enableRecommendVerify" label="所需推荐人数">
          <uni-number-box v-model="formData.features.recommendCount" :min="1" :max="10" />
          <text class="switch-desc">被推荐人获得该数量推荐后自动通过认证</text>
        </uni-forms-item>
      </uni-card>

      <!-- 联系方式 -->
      <uni-card title="联系方式" :is-shadow="false" class="mt-20">
        <uni-forms-item label="联系邮箱" name="contact.email">
          <uni-easyinput v-model="formData.contact.email" placeholder="请输入联系邮箱" />
        </uni-forms-item>

        <uni-forms-item label="联系电话" name="contact.phone">
          <uni-easyinput v-model="formData.contact.phone" placeholder="请输入联系电话" />
        </uni-forms-item>

        <uni-forms-item label="联系地址" name="contact.address">
          <uni-easyinput type="textarea" v-model="formData.contact.address" placeholder="请输入联系地址" />
        </uni-forms-item>
      </uni-card>
    </uni-forms>

    <!-- 操作按钮 -->
    <view class="action-bar">
      <button type="default" @click="resetForm">重置</button>
      <button type="primary" :loading="saving" @click="saveConfig">保存配置</button>
    </view>
  </view>
</template>

<script>
const alumniAdminCo = uniCloud.importObject('alumni-admin-co')

export default {
  data() {
    return {
      loading: false,
      saving: false,
      schoolTypeOptions: [
        { value: 'university', label: '大学' },
        { value: 'highschool', label: '高中' },
        { value: 'middleschool', label: '初中' }
      ],
      degreeOptions: [
        { value: 'bachelor', label: '本科' },
        { value: 'master', label: '硕士' },
        { value: 'doctor', label: '博士' },
        { value: 'highschool', label: '高中' },
        { value: 'middleschool', label: '初中' }
      ],
      formData: {
        name: '',
        appName: '',
        type: 'university',
        localDegrees: ['bachelor', 'master', 'doctor'],
        colleges: [],
        logo: '',
        branding: {
          primaryColor: '#2B5CE6',
          primaryLight: '#5B7FEF',
          slogan: ''
        },
        features: {
          enableVerification: true,
          enableFriendship: true,
          enableChat: true,
          enableActivity: true,
          enableRecommendVerify: false,
          recommendCount: 3,
          requireProof: false
        },
        contact: {
          email: '',
          phone: '',
          address: ''
        }
      },
      originalData: null,
      rules: {
        name: { rules: [{ required: true, errorMessage: '请输入学校名称' }] },
        appName: { rules: [{ required: true, errorMessage: '请输入应用名称' }] }
      }
    }
  },
  computed: {
    schoolTypeIndex() {
      return this.schoolTypeOptions.findIndex(o => o.value === this.formData.type)
    },
    currentSchoolTypeLabel() {
      const opt = this.schoolTypeOptions.find(o => o.value === this.formData.type)
      return opt ? opt.label : '请选择'
    }
  },
  onLoad() {
    this.loadConfig()
  },
  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const res = await alumniAdminCo.getSchoolConfig()
        if (res.errCode === 0 && res.data) {
          const d = res.data
          this.formData = {
            name: d.name || d.appName || '',
            appName: d.appName || d.name || '',
            type: d.type || 'university',
            localDegrees: d.localDegrees || [],
            colleges: d.colleges || [],
            logo: d.logo || '',
            branding: {
              primaryColor: d.branding?.primaryColor || '#2B5CE6',
              primaryLight: d.branding?.primaryLight || '#5B7FEF',
              slogan: d.branding?.slogan || ''
            },
            features: {
              enableVerification: d.features?.enableVerification !== false,
              enableFriendship: d.features?.enableFriendship !== false,
              enableChat: d.features?.enableChat !== false,
              enableActivity: d.features?.enableActivity !== false,
              enableRecommendVerify: d.features?.enableRecommendVerify === true,
              recommendCount: d.features?.recommendCount || 3,
              requireProof: d.features?.requireProof === true
            },
            contact: {
              email: d.contact?.email || '',
              phone: d.contact?.phone || '',
              address: d.contact?.address || ''
            }
          }
          this.originalData = JSON.parse(JSON.stringify(this.formData))
        }
      } catch (e) {
        console.error('加载配置失败', e)
        uni.showToast({ title: '加载配置失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    onSchoolTypeChange(e) {
      const idx = e.detail.value
      this.formData.type = this.schoolTypeOptions[idx].value
      // 切换类型时自动设置默认 localDegrees
      const defaults = {
        university: ['bachelor', 'master', 'doctor'],
        highschool: ['highschool'],
        middleschool: ['middleschool']
      }
      this.formData.localDegrees = defaults[this.formData.type] || []
      // 非大学类型清空学院配置
      if (this.formData.type !== 'university') {
        this.formData.colleges = []
      }
    },
    toggleLocalDegree(value) {
      const idx = this.formData.localDegrees.indexOf(value)
      if (idx >= 0) {
        this.formData.localDegrees.splice(idx, 1)
      } else {
        this.formData.localDegrees.push(value)
      }
    },
    addCollege() {
      this.formData.colleges.push({ name: '', majors: [] })
    },
    removeCollege(ci) {
      this.formData.colleges.splice(ci, 1)
    },
    addMajor(ci) {
      this.formData.colleges[ci].majors.push('')
    },
    removeMajor(ci, mi) {
      this.formData.colleges[ci].majors.splice(mi, 1)
    },
    async uploadLogo() {
      try {
        const [file] = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album'],
            success: res => resolve(res.tempFiles),
            fail: reject
          })
        })
        uni.showLoading({ title: '上传中...' })
        // H5 端 tempFiles[0] 里文件对象在 file.file，其他端在 file.path
        const filePath = file.file || file.path
        const ext = (file.name || file.path || 'jpg').split('.').pop()
        const uploadRes = await uniCloud.uploadFile({
          filePath,
          cloudPath: `school-logo/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        })
        this.formData.logo = uploadRes.fileID
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        if (e.errMsg !== 'chooseImage:fail cancel') {
          uni.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    },
    removeLogo() {
      uni.showModal({
        title: '提示',
        content: '确定要移除Logo吗？',
        success: res => { if (res.confirm) this.formData.logo = '' }
      })
    },
    previewLogo() {
      if (this.formData.logo) uni.previewImage({ urls: [this.formData.logo] })
    },
    resetForm() {
      if (this.originalData) {
        this.formData = JSON.parse(JSON.stringify(this.originalData))
      }
    },
    async saveConfig() {
      try {
        await this.$refs.configForm.validate()
      } catch (e) {
        return
      }
      if (this.formData.localDegrees.length === 0) {
        uni.showToast({ title: '请至少选择一个本校学历', icon: 'none' })
        return
      }
      this.saving = true
      try {
        const res = await alumniAdminCo.saveSchoolConfig(this.formData)
        if (res.errCode === 0) {
          uni.showToast({ title: '保存成功', icon: 'success' })
          this.originalData = JSON.parse(JSON.stringify(this.formData))
        } else {
          uni.showToast({ title: res.errMsg || '保存失败', icon: 'none' })
        }
      } catch (e) {
        console.error('保存失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.saving = false
      }
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

.mt-20 { margin-top: 20px; }
.mb-10 { margin-bottom: 10px; }

.picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  color: #333;
  font-size: 14px;
}

.field-desc {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.college-item {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.college-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.college-name-input {
  flex: 1;
}

.college-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.major-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 12px;
}

.major-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.major-delete {
  flex-shrink: 0;
  cursor: pointer;
}

.add-college-btn {
  width: 100%;
  margin-top: 4px;
}

.logo-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-preview {
  width: 100px;
  height: 100px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
}

.logo-placeholder {
  width: 100px;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  font-size: 12px;
}

.logo-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  cursor: pointer;
  padding: 0;
}

.color-text { width: 120px; }

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.theme-preview {
  padding: 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--preview-primary), var(--preview-light));
}

.preview-header { margin-bottom: 15px; }

.preview-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  display: block;
}

.preview-slogan {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 4px;
}

.preview-btn {
  display: inline-block;
  padding: 8px 20px;
  background-color: #fff;
  color: var(--preview-primary);
  border-radius: 20px;
  font-size: 14px;
}

.switch-desc {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
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
</style>