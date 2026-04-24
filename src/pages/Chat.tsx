import { DashboardLayout } from '@/components/layout'
import { ChatInterface } from '@/components/ai/ChatInterface'

export function Chat() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)]">
        <ChatInterface initialMode="chat" title="Mucho3D Chat" className="h-full" />
      </div>
    </DashboardLayout>
  )
}

export default Chat
