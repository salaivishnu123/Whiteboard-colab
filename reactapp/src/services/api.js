import axios from "axios";

const computeDefaultBase = () => {
  if (typeof window !== "undefined" && window.location) {
    try {
      const url = new URL(window.location.href);
      const { protocol, hostname } = url;
      
      // Premium project pattern mapping: 8081-xxxx -> 8080-xxxx (no explicit port)
      if (/\.premiumproject\.examly\.io$/.test(hostname)) {
        if (hostname.startsWith("8081-")) {
          const backendHost = hostname.replace(/^8081-/, "8080-");
          const backendURL = `${protocol}//${backendHost}`;
          return backendURL;
        }
        if (hostname.startsWith("8080-")) {
          return `${protocol}//${hostname}`;
        }
      }
      // Local dev: map to :8080 on same host
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${protocol}//${hostname}:8080`;
      }
      // Fallback
      return "http://localhost:8080";
    } catch (e) {
      console.error("Error computing API base:", e);
      return "http://localhost:8080";
    }
  }
  return "http://localhost:8080";
};

export const API_BASE = process.env.REACT_APP_API_BASE || computeDefaultBase();

// Configure axios defaults
axios.defaults.timeout = 30000;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

// Auth API functions
export const register = (payload) => 
  axios.post(`${API_BASE}/api/auth/register`, payload).then(r => r.data);

export const login = (payload) => 
  axios.post(`${API_BASE}/api/auth/login`, payload).then(r => r.data);

export const logout = () => 
  axios.post(`${API_BASE}/api/auth/logout`).then(r => r.data);

// User API functions
export const getProfile = () => 
  axios.get(`${API_BASE}/api/users/profile`).then(r => r.data);

export const updateProfile = (payload) => 
  axios.put(`${API_BASE}/api/users/profile`, payload).then(r => r.data);

export const getAllUsers = (adminEmail) => 
  axios.get(`${API_BASE}/api/users`, { params: { adminEmail } }).then(r => r.data);

export const deleteUser = (id, adminEmail) => 
  axios.delete(`${API_BASE}/api/users/${id}`, { params: { adminEmail } }).then(r => r.data);

// Workspace API functions
export const listWorkspaces = (email, page = 0, size = 10, sortBy = "id", sortDir = "asc") => 
  axios.get(`${API_BASE}/api/workspaces`, {
    params: { email, page, size, sortBy, sortDir }
  }).then(r => r.data);

export const getWorkspace = (id) => 
  axios.get(`${API_BASE}/api/workspaces/${id}`).then(r => r.data);

export const createWorkspace = (payload) => 
  axios.post(`${API_BASE}/api/workspaces`, payload).then(r => r.data);

export const updateWorkspace = (id, payload) => 
  axios.put(`${API_BASE}/api/workspaces/${id}`, payload).then(r => r.data);

export const deleteWorkspace = (id) => 
  axios.delete(`${API_BASE}/api/workspaces/${id}`).then(r => r.data);

// Whiteboard API functions
export const listWhiteboards = (workspaceId) => 
  axios.get(`${API_BASE}/api/whiteboards`, { params: { workspaceId } }).then(r => r.data);

export const createWhiteboard = (payload) => 
  axios.post(`${API_BASE}/api/whiteboards`, payload).then(r => r.data);

export const updateWhiteboardName = (id, name) => 
  axios.put(`${API_BASE}/api/whiteboards/${id}`, { name }).then(r => r.data);

export const deleteWhiteboard = (id) => 
  axios.delete(`${API_BASE}/api/whiteboards/${id}`).then(r => r.data);

export const inviteCollaborator = (id, payload) => 
  axios.post(`${API_BASE}/api/boards/${id}/invite`, payload).then(r => r.data);

export const getInvitationDetails = (token) => 
  axios.get(`${API_BASE}/api/invite/${token}`).then(r => r.data);

export const acceptInvitation = (token, email) => 
  axios.post(`${API_BASE}/api/invite/${token}/accept`, { email }).then(r => r.data);

export const rejectInvitation = (token, email) => 
  axios.post(`${API_BASE}/api/invite/${token}/reject`, { email }).then(r => r.data);

export const getBoardMembers = (id) => 
  axios.get(`${API_BASE}/api/boards/${id}/members`).then(r => r.data);

export const updateBoardMemberRole = (id, email, role) => 
  axios.patch(`${API_BASE}/api/boards/${id}/member-role`, { email, role }).then(r => r.data);

export const removeBoardMember = (id, email) => 
  axios.delete(`${API_BASE}/api/boards/${id}/member`, { params: { email } }).then(r => r.data);

export const updateBoardShareSettings = (id, visibility) => 
  axios.post(`${API_BASE}/api/boards/${id}/share-link`, { visibility }).then(r => r.data);

// Backward compatibility exports for original unit tests
export const getSessions = () => 
  axios.get(`${API_BASE}/api/whiteboards`).then(r => r.data);

export const createSession = (payload) => 
  axios.post(`${API_BASE}/api/whiteboards`, { name: payload.sessionName }).then(r => r.data);

export const getSessionById = (id) => 
  axios.get(`${API_BASE}/api/whiteboards/${id}`).then(r => r.data);

