import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

const BASE_URL = "http://localhost:3000";

function ChatPanel({
  contacts,
  activeContact,
  onSelectContact,
  messages,
  messageText,
  onMessageTextChange,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  loadingContacts,
  loadingMessages,
  darkMode = false,
}) {
  const getImageUrl = (image) => (image ? `${BASE_URL}/uploads/${image}` : "");
  const currentUserId =
    localStorage.getItem("userId") ||
    JSON.parse(localStorage.getItem("user") || "{}")._id ||
    "";
  const hasOverflowMessages = messages.length > 5;
  const chatMinHeight = hasOverflowMessages ? "560px" : "360px";
  const messageAreaHeight = hasOverflowMessages ? "360px" : "auto";
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const startEdit = (message) => {
    setEditingId(message._id);
    setEditingText(message.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (e, messageId) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    await onEditMessage(messageId, editingText.trim());
    cancelEdit();
  };

  const styles = {
    shell: {
      display: "grid",
      gridTemplateColumns: "minmax(240px, 300px) minmax(0, 1fr)",
      gap: "18px",
    },
    card: {
      borderRadius: "22px",
      background: darkMode ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.82)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 42px rgba(15,23,42,0.08)",
      padding: "18px",
    },
    chatCard: {
      borderRadius: "22px",
      background: darkMode ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.82)",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(148,163,184,0.16)",
      boxShadow: "0 18px 42px rgba(15,23,42,0.08)",
      overflow: "hidden",
      display: "grid",
      gridTemplateRows: "auto minmax(0, 1fr) auto",
      minHeight: chatMinHeight,
    },
    title: {
      fontWeight: "800",
      color: darkMode ? "#f8fafc" : "#0f172a",
      marginBottom: "6px",
    },
    text: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: "0.94rem",
      lineHeight: 1.6,
    },
    contactList: {
      display: "grid",
      gap: "10px",
      marginTop: "16px",
    },
    contactButton: (active) => ({
      width: "100%",
      border: active ? "1px solid rgba(14,165,233,0.3)" : "1px solid transparent",
      borderRadius: "18px",
      padding: "12px",
      background: active
        ? "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(37,99,235,0.16))"
        : darkMode
        ? "rgba(2,6,23,0.35)"
        : "#f8fafc",
      display: "flex",
      gap: "12px",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "left",
      transition: "background 0.2s ease",
    }),
    avatar: {
      width: "46px",
      height: "46px",
      borderRadius: "16px",
      objectFit: "cover",
      background: darkMode ? "#1e293b" : "#dbeafe",
      display: "grid",
      placeItems: "center",
      color: darkMode ? "#e2e8f0" : "#0f172a",
      fontWeight: "800",
      flexShrink: 0,
    },
    contactName: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontWeight: "700",
      marginBottom: "4px",
    },
    contactMeta: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: "0.85rem",
    },
    chatHeader: {
      padding: "16px 18px",
      borderBottom: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(226,232,240,0.9)",
      background: darkMode
        ? "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.76))"
        : "linear-gradient(180deg, rgba(248,250,252,0.96), rgba(255,255,255,0.94))",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    chatHeaderTitle: {
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontWeight: "800",
      marginBottom: "2px",
    },
    chatHeaderMeta: {
      color: darkMode ? "#94a3b8" : "#64748b",
      fontSize: "0.84rem",
    },
    messagesWrap: {
      overflowY: hasOverflowMessages ? "auto" : "visible",
      display: "grid",
      gap: "10px",
      padding: "18px",
      background: darkMode
        ? "linear-gradient(180deg, rgba(2,6,23,0.42), rgba(15,23,42,0.48))"
        : "linear-gradient(180deg, #f8fafc, #f1f5f9)",
      alignContent: "start",
      minHeight: "140px",
      maxHeight: messageAreaHeight,
    },
    bubble: (mine) => ({
      width: "fit-content",
      maxWidth: "78%",
      minWidth: "90px",
      justifySelf: mine ? "end" : "start",
      padding: "8px 12px 7px",
      borderRadius: mine ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
      background: mine
        ? darkMode
          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
          : "linear-gradient(135deg, #dcf8c6, #bbf7d0)"
        : darkMode
        ? "rgba(30,41,59,0.92)"
        : "#ffffff",
      color: mine
        ? darkMode
          ? "#ffffff"
          : "#0f172a"
        : darkMode
        ? "#e2e8f0"
        : "#0f172a",
      boxShadow: darkMode
        ? "0 10px 22px rgba(2,6,23,0.16)"
        : "0 6px 16px rgba(15,23,42,0.08)",
      position: "relative",
      wordBreak: "break-word",
    }),
    bubbleName: {
      fontSize: "0.72rem",
      opacity: 0.78,
      marginBottom: "3px",
      fontWeight: "700",
    },
    bubbleText: {
      fontSize: "0.95rem",
      lineHeight: 1.45,
      whiteSpace: "pre-wrap",
    },
    bubbleTime: {
      marginTop: "5px",
      fontSize: "0.68rem",
      opacity: 0.7,
      textAlign: "right",
    },
    editedLabel: {
      marginLeft: "6px",
      fontSize: "0.66rem",
      opacity: 0.75,
    },
    bubbleActions: {
      position: "absolute",
      top: "-10px",
      right: "10px",
      display: "flex",
      gap: "6px",
      opacity: 0,
      transform: "translateY(4px)",
      transition: "opacity 0.18s ease, transform 0.18s ease",
    },
    bubbleActionsVisible: {
      opacity: 1,
      transform: "translateY(0)",
    },
    bubbleActionButton: {
      border: "none",
      borderRadius: "999px",
      width: "28px",
      height: "28px",
      padding: 0,
      background: darkMode ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.96)",
      color: darkMode ? "#f8fafc" : "#0f172a",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      boxShadow: darkMode
        ? "0 8px 18px rgba(2,6,23,0.28)"
        : "0 8px 18px rgba(15,23,42,0.12)",
    },
    editForm: {
      display: "grid",
      gap: "8px",
    },
    editInput: {
      width: "100%",
      minHeight: "70px",
      borderRadius: "12px",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.24)"
        : "1px solid rgba(148,163,184,0.22)",
      background: darkMode ? "rgba(2,6,23,0.35)" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#0f172a",
      padding: "10px 12px",
      resize: "vertical",
      outline: "none",
    },
    editActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
    },
    editButton: {
      border: "none",
      borderRadius: "999px",
      padding: "7px 12px",
      background: "linear-gradient(135deg, #22c55e, #15803d)",
      color: "#fff",
      fontSize: "0.72rem",
      fontWeight: "800",
      cursor: "pointer",
    },
    cancelButton: {
      border: "none",
      borderRadius: "999px",
      padding: "7px 12px",
      background: darkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
      color: darkMode ? "#f8fafc" : "#0f172a",
      fontSize: "0.72rem",
      fontWeight: "800",
      cursor: "pointer",
    },
    inputRow: {
      display: "flex",
      gap: "10px",
      padding: "14px 16px",
      borderTop: darkMode
        ? "1px solid rgba(148,163,184,0.12)"
        : "1px solid rgba(226,232,240,0.9)",
      background: darkMode
        ? "rgba(15,23,42,0.82)"
        : "rgba(255,255,255,0.96)",
    },
    input: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "999px",
      border: darkMode
        ? "1px solid rgba(148,163,184,0.18)"
        : "1px solid rgba(148,163,184,0.2)",
      background: darkMode ? "rgba(2,6,23,0.45)" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#0f172a",
      outline: "none",
    },
    sendButton: {
      border: "none",
      borderRadius: "999px",
      padding: "12px 18px",
      background: "linear-gradient(135deg, #25d366, #128c7e)",
      color: "#fff",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(18,140,126,0.22)",
    },
    empty: {
      padding: "18px",
      borderRadius: "16px",
      textAlign: "center",
      color: darkMode ? "#94a3b8" : "#64748b",
      background: darkMode ? "rgba(2,6,23,0.28)" : "#f8fafc",
      border: darkMode
        ? "1px dashed rgba(148,163,184,0.18)"
        : "1px dashed rgba(148,163,184,0.2)",
    },
  };

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.title}>People</div>
        <div style={styles.text}>Open a conversation with one employee or manager.</div>

        <div style={styles.contactList}>
          {loadingContacts ? (
            <div style={styles.empty}>Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div style={styles.empty}>No contacts available.</div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.userId}
                type="button"
                style={styles.contactButton(activeContact?.userId === contact.userId)}
                onClick={() => onSelectContact(contact)}
              >
                {contact.image ? (
                  <img
                    src={getImageUrl(contact.image)}
                    alt={contact.name}
                    style={styles.avatar}
                  />
                ) : (
                  <div style={styles.avatar}>
                    {contact.name?.slice(0, 2)?.toUpperCase() || "US"}
                  </div>
                )}
                <div>
                  <div style={styles.contactName}>{contact.name}</div>
                  <div style={styles.contactMeta}>
                    {contact.designation || contact.role}
                    {contact.department ? ` | ${contact.department}` : ""}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div style={styles.chatCard}>
        {activeContact ? (
          <>
            <div style={styles.chatHeader}>
              {activeContact.image ? (
                <img
                  src={getImageUrl(activeContact.image)}
                  alt={activeContact.name}
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatar}>
                  {activeContact.name?.slice(0, 2)?.toUpperCase() || "US"}
                </div>
              )}
              <div>
                <div style={styles.chatHeaderTitle}>{activeContact.name}</div>
                <div style={styles.chatHeaderMeta}>
                  {activeContact.designation || activeContact.role}
                  {activeContact.department ? ` | ${activeContact.department}` : ""}
                </div>
              </div>
            </div>

            <div style={styles.messagesWrap}>
              {loadingMessages ? (
                <div style={styles.empty}>Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div style={styles.empty}>No messages yet. Start the conversation.</div>
              ) : (
                messages.map((message) => {
                  const mine = String(message.senderUserId) === String(currentUserId);
                  const isEditing = editingId === message._id;

                  return (
                    <div
                      key={message._id}
                      style={styles.bubble(mine)}
                      onMouseEnter={() => setHoveredMessageId(message._id)}
                      onMouseLeave={() => setHoveredMessageId((current) =>
                        current === message._id ? null : current
                      )}
                    >
                      {!mine ? (
                        <div style={styles.bubbleName}>{message.senderName}</div>
                      ) : null}

                      {isEditing ? (
                        <form style={styles.editForm} onSubmit={(e) => saveEdit(e, message._id)}>
                          <textarea
                            style={styles.editInput}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                          <div style={styles.editActions}>
                            <button type="button" style={styles.cancelButton} onClick={cancelEdit}>
                              Cancel
                            </button>
                            <button type="submit" style={styles.editButton}>
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div style={styles.bubbleText}>{message.text}</div>
                          <div style={styles.bubbleTime}>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.isEdited ? (
                              <span style={styles.editedLabel}>edited</span>
                            ) : null}
                          </div>

                          {mine ? (
                            <div
                              style={{
                                ...styles.bubbleActions,
                                ...(hoveredMessageId === message._id
                                  ? styles.bubbleActionsVisible
                                  : null),
                              }}
                            >
                              <button
                                type="button"
                                style={styles.bubbleActionButton}
                                onClick={() => startEdit(message)}
                                aria-label="Edit message"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                style={styles.bubbleActionButton}
                                onClick={() => onDeleteMessage(message._id)}
                                aria-label="Delete message"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <form style={styles.inputRow} onSubmit={onSendMessage}>
              <input
                style={styles.input}
                value={messageText}
                onChange={(e) => onMessageTextChange(e.target.value)}
                placeholder="Type a message"
              />
              <button type="submit" style={styles.sendButton}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ ...styles.empty, margin: "18px" }}>
            Select a contact from the list to open chat.
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPanel;
