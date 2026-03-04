<template>
  <view class="uni-container">
    <uni-card :is-shadow="false" is-full>
      <text class="uni-title">发布官方活动</text>
    </uni-card>

    <uni-forms ref="form" :modelValue="formData" :rules="rules">
      <uni-forms-item label="活动标题" required name="title">
        <uni-easyinput v-model="formData.title" placeholder="请输入活动标题" />
      </uni-forms-item>

      <uni-forms-item label="活动类型" required name="type">
        <uni-data-checkbox v-model="formData.type" :localdata="typeOptions" />
      </uni-forms-item>

      <uni-forms-item label="活动简介" name="description">
        <uni-easyinput type="textarea" v-model="formData.description" placeholder="请输入活动简介" />
      </uni-forms-item>

      <uni-forms-item label="开始时间" required name="startTime">
        <uni-datetime-picker v-model="formData.startTime" type="datetime" />
      </uni-forms-item>

      <uni-forms-item label="结束时间" name="endTime">
        <uni-datetime-picker v-model="formData.endTime" type="datetime" />
      </uni-forms-item>

      <uni-forms-item label="活动地点" name="locationName">
        <uni-easyinput v-model="formData.locationName" placeholder="请输入活动地点" />
      </uni-forms-item>

      <uni-forms-item label="人数上限" name="maxParticipants">
        <uni-easyinput type="number" v-model.number="formData.maxParticipants" placeholder="0表示不限" />
      </uni-forms-item>

      <uni-forms-item label="活动费用" name="fee">
        <uni-easyinput type="number" v-model.number="formData.fee" placeholder="0表示免费" />
      </uni-forms-item>

      <view class="uni-button-group">
        <button type="primary" @click="submit">发布活动</button>
        <button @click="cancel">取消</button>
      </view>
    </uni-forms>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      formData: {
        title: '',
        type: 'offline',
        description: '',
        startTime: Date.now() + 86400000,
        endTime: null,
        locationName: '',
        maxParticipants: 0,
        fee: 0
      },
      typeOptions: [
        { value: 'online', text: '线上' },
        { value: 'offline', text: '线下' },
        { value: 'hybrid', text: '线上+线下' }
      ],
      rules: {
        title: { rules: [{ required: true, errorMessage: '请输入活动标题' }] },
        type: { rules: [{ required: true, errorMessage: '请选择活动类型' }] },
        startTime: { rules: [{ required: true, errorMessage: '请选择开始时间' }] }
      }
    }
  },
  methods: {
    async submit() {
      try {
        await this.$refs.form.validate()
      } catch (e) {
        return
      }

      uni.showLoading({ title: '发布中' })
      try {
        const activity = {
          title: this.formData.title,
          description: this.formData.description,
          type: this.formData.type,
          startTime: this.formData.startTime,
          endTime: this.formData.endTime,
          maxParticipants: this.formData.maxParticipants || 0,
          fee: this.formData.fee || 0,
          location: this.formData.locationName ? { name: this.formData.locationName } : null,
          organizerId: 'admin',
          organizerType: 'organization',
          isOfficial: true,
          auditStatus: 1,
          status: 1,
          currentParticipants: 0,
          viewCount: 0,
          createTime: Date.now(),
          updateTime: Date.now()
        }

        await db.collection('alumni-activities').add(activity)

        uni.hideLoading()
        uni.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        uni.hideLoading()
        console.error('发布失败', e)
        uni.showToast({ title: '发布失败', icon: 'none' })
      }
    },
    cancel() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
.uni-button-group {
  display: flex;
  gap: 20px;
  margin-top: 30px;
  padding: 0 20px;
}
.uni-button-group button {
  flex: 1;
}
</style>
