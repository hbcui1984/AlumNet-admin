<template>
  <view class="container">
    <uni-card :is-shadow="false" is-full>
      <view class="header">
        <text class="title">字典管理</text>
      </view>

      <uni-section title="行业分类" type="line">
        <view class="dict-section">
          <view class="dict-header">
            <button type="primary" size="mini" @click="addItem('industry')">添加行业</button>
          </view>
          <uni-table stripe emptyText="暂无数据">
            <uni-tr>
              <uni-th width="80" align="center">排序</uni-th>
              <uni-th width="150" align="left">标识</uni-th>
              <uni-th align="left">名称</uni-th>
              <uni-th width="80" align="center">状态</uni-th>
              <uni-th width="150" align="center">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="item in industryItems" :key="item.value">
              <uni-td align="center">{{ item.sort }}</uni-td>
              <uni-td align="left">{{ item.value }}</uni-td>
              <uni-td align="left">{{ item.label }}</uni-td>
              <uni-td align="center">
                <uni-tag :text="item.enabled ? '启用' : '禁用'" :type="item.enabled ? 'success' : 'error'" size="small" />
              </uni-td>
              <uni-td align="center">
                <button type="default" size="mini" @click="editItem('industry', item)">编辑</button>
                <button type="warn" size="mini" @click="deleteItem('industry', item.value)">删除</button>
              </uni-td>
            </uni-tr>
          </uni-table>
        </view>
      </uni-section>

      <uni-section title="兴趣标签" type="line" style="margin-top: 30px;">
        <view class="dict-section">
          <view class="dict-header">
            <button type="primary" size="mini" @click="addItem('interest')">添加标签</button>
          </view>
          <uni-table stripe emptyText="暂无数据">
            <uni-tr>
              <uni-th width="80" align="center">排序</uni-th>
              <uni-th width="150" align="left">标识</uni-th>
              <uni-th align="left">名称</uni-th>
              <uni-th width="80" align="center">状态</uni-th>
              <uni-th width="150" align="center">操作</uni-th>
            </uni-tr>
            <uni-tr v-for="item in interestItems" :key="item.value">
              <uni-td align="center">{{ item.sort }}</uni-td>
              <uni-td align="left">{{ item.value }}</uni-td>
              <uni-td align="left">{{ item.label }}</uni-td>
              <uni-td align="center">
                <uni-tag :text="item.enabled ? '启用' : '禁用'" :type="item.enabled ? 'success' : 'error'" size="small" />
              </uni-td>
              <uni-td align="center">
                <button type="default" size="mini" @click="editItem('interest', item)">编辑</button>
                <button type="warn" size="mini" @click="deleteItem('interest', item.value)">删除</button>
              </uni-td>
            </uni-tr>
          </uni-table>
        </view>
      </uni-section>
    </uni-card>

    <!-- 编辑弹窗 -->
    <uni-popup ref="editPopup" type="dialog">
      <uni-popup-dialog mode="input" title="编辑字典项" :value="editForm.label" placeholder="请输入名称" @confirm="saveItem">
        <view class="edit-form">
          <uni-forms ref="form" :modelValue="editForm">
            <uni-forms-item label="标识" required>
              <uni-easyinput v-model="editForm.value" placeholder="英文标识，如 internet" :disabled="!isAdd" />
            </uni-forms-item>
            <uni-forms-item label="名称" required>
              <uni-easyinput v-model="editForm.label" placeholder="显示名称" />
            </uni-forms-item>
            <uni-forms-item label="排序">
              <uni-easyinput v-model.number="editForm.sort" type="number" placeholder="数字越小越靠前" />
            </uni-forms-item>
            <uni-forms-item label="状态">
              <switch :checked="editForm.enabled" @change="e => editForm.enabled = e.detail.value" />
            </uni-forms-item>
          </uni-forms>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      industryItems: [],
      interestItems: [],
      editForm: {
        value: '',
        label: '',
        sort: 0,
        enabled: true
      },
      editType: '',
      isAdd: false
    }
  },
  onLoad() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const res = await db.collection('alumni-dictionaries').get()
        for (const dict of res.result.data) {
          if (dict.type === 'industry') {
            this.industryItems = dict.items || []
          } else if (dict.type === 'interest') {
            this.interestItems = dict.items || []
          }
        }
      } catch (e) {
        console.error('加载失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    addItem(type) {
      this.editType = type
      this.isAdd = true
      this.editForm = {
        value: '',
        label: '',
        sort: 0,
        enabled: true
      }
      this.$refs.editPopup.open()
    },
    editItem(type, item) {
      this.editType = type
      this.isAdd = false
      this.editForm = { ...item }
      this.$refs.editPopup.open()
    },
    async saveItem() {
      if (!this.editForm.value || !this.editForm.label) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' })
        return
      }

      try {
        const items = this.editType === 'industry' ? [...this.industryItems] : [...this.interestItems]
        const index = items.findIndex(i => i.value === this.editForm.value)

        if (this.isAdd) {
          if (index >= 0) {
            uni.showToast({ title: '标识已存在', icon: 'none' })
            return
          }
          items.push({ ...this.editForm })
        } else {
          if (index >= 0) {
            items[index] = { ...this.editForm }
          }
        }

        await db.collection('alumni-dictionaries')
          .where({ type: this.editType })
          .update({ items })

        uni.showToast({ title: '保存成功', icon: 'success' })
        this.$refs.editPopup.close()
        this.loadData()
      } catch (e) {
        console.error('保存失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },
    async deleteItem(type, value) {
      const res = await new Promise(resolve => {
        uni.showModal({
          title: '确认删除',
          content: '删除后不可恢复，确定要删除吗？',
          success: res => resolve(res.confirm)
        })
      })
      if (!res) return

      try {
        const items = (type === 'industry' ? [...this.industryItems] : [...this.interestItems])
          .filter(i => i.value !== value)

        await db.collection('alumni-dictionaries')
          .where({ type })
          .update({ items })

        uni.showToast({ title: '删除成功', icon: 'success' })
        this.loadData()
      } catch (e) {
        console.error('删除失败', e)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.dict-section {
  margin-top: 10px;
}

.dict-header {
  margin-bottom: 10px;
}

.edit-form {
  padding: 20px;
}

button {
  margin: 0 5px;
}
</style>
