import Session from '../models/session.js';
import Gym from '../models/gym.js';
import User from '../models/user.js';

/**
 * Service to handle session-related business logic.
 */
class SessionService {
  /**
   * Create a new session.
   * @param {Object} sessionData - The session data to create.
   * @returns {Promise<Object>} - The created session.
   */
  async createSession(sessionData) {
    try {
      // Ensure gym exists
      const gym = await Gym.findById(sessionData.gymId);
      if (!gym) throw new Error('Gym not found for provided gymId');

      const session = new Session(sessionData);
      const saved = await session.save();

      // Associate the session with that gym
      try {
        await Gym.findByIdAndUpdate(sessionData.gymId, {
          $addToSet: { sessions: saved._id },
        });
      } catch (err) {
        // ignore failure to associate here; caller can handle consistency
      }

      return saved;
    } catch (error) {
      throw new Error('Error creating session: ' + error.message);
    }
  }

  /**
   * Get all sessions.
   * @returns {Promise<Array>} - List of all sessions.
   */
  async getAllSessions() {
    try {
      return await Session.find();
    } catch (error) {
      throw new Error('Error retrieving sessions: ' + error.message);
    }
  }

  /**
   * Get a session by ID.
   * @param {string} sessionId - The ID of the session to retrieve.
   * @returns {Promise<Object>} - The session object.
   */
  async getSessionById(sessionId) {
    try {
      return await Session.findById(sessionId);
    } catch (error) {
      throw new Error('Error retrieving session: ' + error.message);
    }
  }

  /**
   * Update a session by ID.
   * @param {string} sessionId - The ID of the session to update.
   * @param {Object} updateData - The data to update the session with.
   * @returns {Promise<Object>} - The updated session.
   */
  async updateSession(sessionId, updateData) {
    try {
      const existing = await Session.findById(sessionId);
      if (!existing) throw new Error('Session not found');

      // If gym association changes, update gyms' sessions arrays
      if (
        updateData.gymId &&
        updateData.gymId.toString() !== (existing.gymId || '').toString()
      ) {
        // ensure new gym exists
        const newGym = await Gym.findById(updateData.gymId);
        if (!newGym) throw new Error('New gym not found');

        // remove from old gym
        if (existing.gymId) {
          try {
            await Gym.findByIdAndUpdate(existing.gymId, {
              $pull: { sessions: existing._id },
            });
          } catch (e) {
            /* ignore */
          }
        }

        // add to new gym
        try {
          await Gym.findByIdAndUpdate(updateData.gymId, {
            $addToSet: { sessions: existing._id },
          });
        } catch (e) {
          /* ignore */
        }
      }

      return await Session.findByIdAndUpdate(sessionId, updateData, { new: true });
    } catch (error) {
      throw new Error('Error updating session: ' + error.message);
    }
  }

  /**
   * Delete a session by ID.
   * @param {string} sessionId - The ID of the session to delete.
   * @returns {Promise<Object|null>} - The deleted session or null if not found.
   */
  async deleteSession(sessionId) {
    try {
      const existing = await Session.findById(sessionId);
      if (!existing) return null;

      await Session.findByIdAndDelete(sessionId);

      // remove reference from gym
      if (existing.gymId) {
        try {
          await Gym.findByIdAndUpdate(existing.gymId, {
            $pull: { sessions: existing._id },
          });
        } catch (err) {
          /* ignore */
        }
      }

      return existing;
    } catch (error) {
      throw new Error('Error deleting session: ' + error.message);
    }
  }

  /**
   * Search for sessions by keyword.
   * @param {string} keyword - The keyword to search for in session names/description.
   * @returns {Promise<Array>} - List of matching sessions.
   */
  async searchSessions(keyword) {
    try {
      if (!keyword || keyword.trim() === '') {
        return [];
      }
      const query = {
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      };
      return await Session.find(query);
    } catch (error) {
      throw new Error('Error searching sessions: ' + error.message);
    }
  }

  /**
   * Books a user into a session.
   * @param {string} userId - The ID of the user.
   * @param {string} sessionId - The ID of the session.
   * @returns {Promise<{status, statusCode, message, data}>}
   */
  async bookUserIntoSession(userId, sessionId) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        return {
          status: 'error',
          statusCode: 404,
          message: 'Session not found',
          data: null,
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          status: 'error',
          statusCode: 404,
          message: 'User not found',
          data: null,
        };
      }

      if (session.participants.length >= session.capacity) {
        return {
          status: 'error',
          statusCode: 400,
          message: 'Session is full',
          data: null,
        };
      }

      const alreadyParticipant = session.participants
        .map((p) => p.toString())
        .includes(userId.toString());

      if (alreadyParticipant) {
        return {
          status: 'error',
          statusCode: 400,
          message: 'User already booked in this session',
          data: null,
        };
      }

      session.participants.push(userId);
      user.bookedSessions.push(sessionId);

      await session.save();
      await user.save();

      return {
        status: 'success',
        statusCode: 200,
        message: 'User successfully booked into session.',
        data: session,
      };
    } catch (error) {
      // Let the controller catch and respond with 500
      throw new Error('Error booking user into session: ' + error.message);
    }
  }

  /**
   * Unbooks a user from a session.
   * @param {string} userId - The ID of the user.
   * @param {string} sessionId - The ID of the session.
   * @returns {Promise<{status, statusCode, message, data}>}
   */
  async unbookUserFromSession(userId, sessionId) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        return {
          status: 'error',
          statusCode: 404,
          message: 'Session not found',
          data: null,
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          status: 'error',
          statusCode: 404,
          message: 'User not found',
          data: null,
        };
      }

      await Session.updateOne({ _id: sessionId }, { $pull: { participants: userId } });
      await User.updateOne({ _id: userId }, { $pull: { bookedSessions: sessionId } });

      return {
        status: 'success',
        statusCode: 200,
        message: 'User successfully unbooked from session.',
        data: null,
      };
    } catch (error) {
      throw new Error('Error unbooking user from session: ' + error.message);
    }
  }

  /**
   * Gets all sessions a user is booked into.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<{status, statusCode, message, data}>}
   */
  async getUserBookedSessions(userId) {
    try {
      const user = await User.findById(userId).populate('bookedSessions');
      if (!user) {
        return {
          status: 'error',
          statusCode: 404,
          message: 'User not found',
          data: null,
        };
      }

      return {
        status: 'success',
        statusCode: 200,
        message: 'Successfully retrieved user booked sessions.',
        data: user.bookedSessions,
      };
    } catch (error) {
      throw new Error(
        'Error retrieving user booked sessions: ' + error.message
      );
    }
  }
}

export default new SessionService();
