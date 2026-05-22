/**
 * Frontend API Service Layer — Carpenter Bonus Tracker (SVP)
 * Connects React states to the Express backend database routes.
 */

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = 'API request failed';
    try {
      const data = await response.json();
      errorMsg = data.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return await response.json();
};

export const api = {
  /**
   * Fetch carpenters and monthly tracker ledger data
   * @param {string} month YYYY-MM
   */
  getDashboard: async (month) => {
    const res = await fetch(`/api/dashboard?month=${month}`);
    return handleResponse(res);
  },

  /**
   * Create a new carpenter profile
   * @param {object} profileData { name, phone }
   */
  addCarpenter: async (profileData) => {
    const res = await fetch('/api/carpenters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  /**
   * Update an existing carpenter's profile metadata
   * @param {string} id Carpenter ID
   * @param {object} profileData { name, phone }
   */
  updateCarpenter: async (id, profileData) => {
    const res = await fetch(`/api/carpenters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  /**
   * Delete a carpenter and their entire transaction history
   * @param {string} id Carpenter ID
   */
  deleteCarpenter: async (id) => {
    const res = await fetch(`/api/carpenters/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  /**
   * Complete, update, or clear a specific visit slot
   * @param {object} visitData { carpenterId, month, visitIndex, completed, date, amount }
   */
  saveVisit: async (visitData) => {
    const res = await fetch('/api/records/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitData)
    });
    return handleResponse(res);
  },

  /**
   * Save a single purchase entry on focus blur
   * @param {object} purchaseData { carpenterId, month, visitIndex, amount }
   */
  savePurchase: async (purchaseData) => {
    const res = await fetch('/api/records/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });
    return handleResponse(res);
  }
};
export default api;
