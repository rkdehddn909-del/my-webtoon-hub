// app.js - 통합 JavaScript 파일 (회원가입, 로그인, 본 웹툰 기록, 내 정보 수정)

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.ensureAdminAccount();
    const currentUserData = localStorage.getItem('currentUser');
    this.currentUser = currentUserData ? JSON.parse(currentUserData) : null;
    this.updateUI();
  }

  // 관리자 계정 자동 생성
  ensureAdminAccount() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.find(u => u.username === 'admin')) {
      users.push({ username: 'admin', password: 'admin123', isAdmin: true, watchedWebtoons: [] });
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  // 회원가입
  register(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === username)) {
      alert('이미 존재하는 사용자명입니다.');
      return false;
    }
    users.push({ username, password, watchedWebtoons: [] });
    localStorage.setItem('users', JSON.stringify(users));
    alert('회원가입이 완료되었습니다.');
    this.closeModal();
    return true;
  }

  // 로그인
  login(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.updateUI();
      alert('로그인되었습니다.');
      this.closeModal();
      return true;
    } else {
      alert('사용자명 또는 비밀번호가 잘못되었습니다.');
      return false;
    }
  }

  // 로그아웃
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.updateUI();
    alert('로그아웃되었습니다.');
  }

  // 본 웹툰 기록 추가
  addWatchedWebtoon(title, platform) {
    if (!this.currentUser) return;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === this.currentUser.username);
    if (userIndex !== -1) {
      const webtoon = { title, platform, date: new Date().toISOString() };
      if (!users[userIndex].watchedWebtoons.find(w => w.title === title && w.platform === platform)) {
        users[userIndex].watchedWebtoons.push(webtoon);
        localStorage.setItem('users', JSON.stringify(users));
        this.currentUser = users[userIndex];
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }
    }
  }

  // 본 웹툰 기록 가져오기
  getWatchedWebtoons() {
    return this.currentUser ? this.currentUser.watchedWebtoons : [];
  }

  // UI 업데이트
  updateUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return; // 페이지에 auth-buttons가 없으면 리턴
    if (this.currentUser) {
      const adminTag = this.currentUser.isAdmin ? '[관리자] ' : '';
      authButtons.innerHTML = `
        <span class="user-info">환영합니다, ${adminTag}${this.currentUser.username}님</span>
        <button class="auth-btn" onclick="authManager.showWatchedWebtoons()">본 웹툰</button>
        <button class="auth-btn" onclick="authManager.logout()">로그아웃</button>
      `;
    } else {
      authButtons.innerHTML = `
        <button class="auth-btn" onclick="authManager.showLoginModal()">로그인</button>
        <button class="auth-btn" onclick="authManager.showRegisterModal()">회원가입</button>
      `;
    }
  }

  // 로그인 모달 표시
  showLoginModal() {
    const modal = this.createModal(`
      <h3>로그인</h3>
      <input type="text" id="login-username" placeholder="사용자명" required>
      <input type="password" id="login-password" placeholder="비밀번호" required>
      <button onclick="authManager.login(document.getElementById('login-username').value, document.getElementById('login-password').value)">로그인</button>
      <button onclick="authManager.closeModal()">취소</button>
    `);
    document.body.appendChild(modal);
  }

  // 회원가입 모달 표시
  showRegisterModal() {
    const modal = this.createModal(`
      <h3>회원가입</h3>
      <input type="text" id="register-username" placeholder="사용자명" required>
      <input type="password" id="register-password" placeholder="비밀번호" required>
      <button onclick="authManager.register(document.getElementById('register-username').value, document.getElementById('register-password').value)">회원가입</button>
      <button onclick="authManager.closeModal()">취소</button>
    `);
    document.body.appendChild(modal);
  }

  // 본 웹툰 목록 모달 표시
  showWatchedWebtoons() {
    const watched = this.getWatchedWebtoons();
    let content = '<h3>본 웹툰 기록</h3>';
    if (watched.length === 0) {
      content += '<p>아직 본 웹툰이 없습니다.</p>';
    } else {
      content += '<ul>';
      watched.forEach(w => {
        content += `<li>${w.title} (${w.platform}) - ${new Date(w.date).toLocaleDateString()}</li>`;
      });
      content += '</ul>';
    }
    content += '<button onclick="authManager.closeModal()">닫기</button>';

    const modal = this.createModal(content);
    document.body.appendChild(modal);
  }

  // 프로필 모달 표시
  showProfileModal() {
    const modal = this.createModal(`
      <h3>내 정보 수정</h3>
      <p>현재 사용자명: ${this.currentUser.username}</p>
      <input type="text" id="new-username" placeholder="새 사용자명" value="${this.currentUser.username}">
      <input type="password" id="current-password" placeholder="현재 비밀번호" required>
      <input type="password" id="new-password" placeholder="새 비밀번호 (변경하지 않으려면 비워두세요)">
      <button onclick="authManager.updateProfile()">수정</button>
      <button onclick="authManager.closeModal()">취소</button>
    `);
    document.body.appendChild(modal);
  }

  // 프로필 업데이트
  updateProfile() {
    const newUsername = document.getElementById('new-username').value.trim();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    if (currentPassword !== this.currentUser.password) {
      alert('현재 비밀번호가 잘못되었습니다.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === this.currentUser.username);

    if (userIndex !== -1) {
      if (newUsername && newUsername !== this.currentUser.username) {
        if (users.find(u => u.username === newUsername && u !== users[userIndex])) {
          alert('이미 존재하는 사용자명입니다.');
          return;
        }
        users[userIndex].username = newUsername;
      }

      if (newPassword) {
        users[userIndex].password = newPassword;
      }

      localStorage.setItem('users', JSON.stringify(users));
      this.currentUser = users[userIndex];
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.updateUI();
      alert('정보가 수정되었습니다.');
      this.closeModal();
    }
  }

  // 모달 생성 헬퍼
  createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-content">
        ${content}
      </div>
    `;
    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal();
    };
    return modal;
  }

  // 모달 닫기
  closeModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) modal.remove();
  }
}

// 전역 인스턴스 생성
const authManager = new AuthManager();