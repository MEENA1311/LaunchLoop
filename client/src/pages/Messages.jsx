import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Empty, relative } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Messages() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const loadConversations = async () => {
    try {
      const convs = await get('/conversations');
      setConversations(convs);
      if (convs.length && !selectedConv) {
        selectConversation(convs[0]);
      } else if (!convs.length) {
        // Fallback: load general messages if conversations empty
        const general = await get('/messages');
        setMessages(general);
      }
    } catch {
      const general = await get('/messages').catch(() => []);
      setMessages(general);
    }
  };

  const selectConversation = async conv => {
    setSelectedConv(conv);
    try {
      const msgs = await get(`/conversations/${conv.id}/messages`);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadConversations();
    get('/users').then(setAllUsers).catch(() => {});

    // Socket.IO live sync
    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('message', newMsg => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      loadConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim()) return;

    const outgoing = body.trim();
    setBody('');

    try {
      const payload = {
        conversation_id: selectedConv ? selectedConv.id : null,
        body: outgoing
      };
      const res = await post('/messages', payload);

      // Optimistic update
      setMessages(prev => [
        ...prev,
        {
          id: res.id || Date.now(),
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          body: outgoing,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      toast.error('Failed to send message: ' + err.message);
    }
  }

  async function startNewChat(e) {
    e.preventDefault();
    if (!targetUserId) return;
    try {
      const res = await post('/conversations', { target_user_id: Number(targetUserId) });
      toast.success('Conversation started!');
      setNewChatOpen(false);
      setTargetUserId('');
      const convs = await get('/conversations');
      setConversations(convs);
      const target = convs.find(c => c.id === res.id) || convs[0];
      if (target) selectConversation(target);
    } catch (err) {
      toast.error(err.message || 'Failed to start chat');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="COMMUNICATION"
        title="Direct Ecosystem Messaging"
        action={
          <Btn onClick={() => setNewChatOpen(true)}>
            ＋ New Conversation
          </Btn>
        }
      />

      <div className="message-layout">
        {/* Left: Conversations list */}
        <Card className="conversation-list">
          <div className="conversation-title">
            <b>Active Conversations</b>
            <span>{conversations.length}</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '550px' }}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation clickable ${selectedConv?.id === conv.id ? 'active' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <div className="tiny-avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                  {conv.partner_name?.[0] || 'U'}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{conv.partner_name}</b>
                    <small>{relative(conv.last_message_at)}</small>
                  </div>
                  <span style={{ fontSize: '8px', color: '#2d7ff9' }}>{conv.partner_role}</span>
                  <p>{conv.last_message || 'Conversation started'}</p>
                </div>
              </div>
            ))}

            {!conversations.length && (
              <div style={{ padding: '25px', textAlign: 'center' }}>
                <small className="muted">No conversations yet.</small>
                <div style={{ marginTop: '10px' }}>
                  <Btn variant="soft" onClick={() => setNewChatOpen(true)}>
                    Start First Chat
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Active Chat Window */}
        <Card className="chat-card">
          <div className="chat-header">
            <div className="person-line">
              <div className="avatar">
                {selectedConv ? selectedConv.partner_name?.[0] : '💬'}
              </div>
              <div>
                <b>{selectedConv ? selectedConv.partner_name : 'General Ecosystem Thread'}</b>
                <span>{selectedConv ? `${selectedConv.partner_role} · ${selectedConv.partner_email}` : 'Community workspace'}</span>
              </div>
            </div>
            <Pill tone="success">Real-Time Sync Active</Pill>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => {
              const isMine = m.sender_id === currentUser.id;
              return (
                <div key={m.id || idx} className={`bubble-row ${isMine ? 'mine' : ''}`}>
                  <div className="bubble">
                    <b style={{ color: isMine ? '#2d7ff9' : '#15213b' }}>
                      {isMine ? 'You' : m.sender_name}
                    </b>
                    <p>{m.body}</p>
                    <small>{relative(m.created_at)}</small>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />

            {!messages.length && (
              <Empty
                title="Say hello!"
                text="Send a message to initiate collaboration or check in on project milestones."
              />
            )}
          </div>

          <form className="chat-input" onSubmit={handleSend}>
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type your message and press Enter..."
            />
            <Btn type="submit">
              Send ✈
            </Btn>
          </form>
        </Card>
      </div>

      {/* Start New Chat Modal */}
      {newChatOpen && (
        <Modal
          eyebrow="DIRECT MESSAGE"
          title="Start a New Conversation"
          close={() => setNewChatOpen(false)}
        >
          <form className="modal-form" onSubmit={startNewChat}>
            <Select
              label="Select Person to Message"
              required
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
            >
              <option value="">-- Choose member --</option>
              {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
              ))}
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setNewChatOpen(false)}>Cancel</Btn>
              <Btn type="submit">Open Chat →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
