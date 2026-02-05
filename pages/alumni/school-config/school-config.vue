<template>
  <view class="page-container">
    <view class="page-header">
      <text class="page-title">学校配置</text>
      <text class="page-desc">配置校友会基本信息、品牌样式和功能开关</text>
    </view>

    <uni-forms ref="configForm" :modelValue="formData" :rules="rules" label-width="120px">
      <!-- 基本信息 -->
      <uni-card title="基本信息" :is-shadow="false">
        <uni-forms-item label="应用名称" name="appName" required>
          <uni-easyinput v-model="formData.appName" placeholder="请输入应用名称，如：XX大学校友会" />
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
      formData: {
        appName: '',
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
          enableActivity: true
        },
        contact: {
          email: '',
          phone: '',
          address: ''
        }
      },
      originalData: null,
      rules: {
        appName: {
          rules: [{ required: true, errorMessage: '请输入应用名称' }]
        }
      }
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
          this.formData = {
            appName: res.data.appName || '',
            logo: res.data.logo || '',
            branding: {
              primaryColor: res.data.branding?.primaryColor || '#2B5CE6',
              primaryLight: res.data.branding?.primaryLight || '#5B7FEF',
              slogan: res.data.branding?.slogan || ''
            },
            features: {
              enableVerification: res.data.features?.enableVerification !== false,
              enableFriendship: res.data.features?.enableFriendship !== false,
              enableChat: res.data.features?.enableChat !== false,
              enableActivity: res.data.features?.enableActivity !== false
            },
            contact: {
              email: res.data.contact?.email || '',
              phone: res.data.contact?.phone || '',
              address: res.data.contact?.address || ''
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

        const uploadRes = await uniCloud.uploadFile({
          filePath: file.path,
          cloudPath: `school-logo/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.path.split('.').pop()}`
        })

        this.formData.logo = uploadRes.fileID
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        if (e.errMsg !== 'chooseImage:fail cancel') {
          console.error('上传失败', e)
          uni.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    },
    removeLogo() {
      uni.showModal({
        title: '提示',
        content: '确定要移除Logo吗？',
        success: res => {
          if (res.confirm) {
            this.formData.logo = ''
          }
        }
      })
    },
    previewLogo() {
      if (this.formData.logo) {
        uni.previewImage({
          urls: [this.formData.logo]
        })
      }
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

.mt-20 {
  margin-top: 20px;
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

.color-text {
  width: 120px;
}

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

.preview-header {
  margin-bottom: 15px;
}

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
