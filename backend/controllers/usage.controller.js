const UsageLog = require('../models/usagelog.model');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Get usage logs for current user
 * @route   GET /api/usage/logs
 * @access  Private
 */
exports.getLogs = async (req, res) => {
  const { apiId, from, to } = req.query;
  const query = { userId: req.user._id };

  if (apiId) query.apiId = apiId;
  if (from || to) {
    query.timestamp = {};
    if (from) query.timestamp.$gte = new Date(from);
    if (to) query.timestamp.$lte = new Date(to);
  }

  try {
    const logs = await UsageLog.find(query)
      .populate('apiId', 'name')
      .populate('apiKeyId', 'keyPrefix')
      .sort({ timestamp: -1 })
      .limit(100);

    return successResponse(res, logs, 'Usage logs retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @desc    Get aggregated usage stats for dashboard
 * @route   GET /api/usage/stats
 * @access  Private
 */
exports.getStats = async (req, res) => {
  const userId = req.user._id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const [
      totalRequests,
      todayRequests,
      monthRequests,
      errorCount,
      avgLatency,
      dailyStats
    ] = await Promise.all([
      // Total requests
      UsageLog.countDocuments({ userId }),
      
      // Requests today
      UsageLog.countDocuments({ userId, timestamp: { $gte: startOfDay } }),
      
      // Requests this month
      UsageLog.countDocuments({ userId, timestamp: { $gte: startOfMonth } }),
      
      // Error count
      UsageLog.countDocuments({ userId, statusCode: { $gte: 400 } }),
      
      // Average Latency
      UsageLog.aggregate([
        { $match: { userId } },
        { $group: { _id: null, avg: { $avg: '$latencyMs' } } }
      ]),

      // Requests per day (last 30 days)
      UsageLog.aggregate([
        { 
          $match: { 
            userId, 
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const stats = {
      totalRequests,
      todayRequests,
      monthRequests,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      avgLatency: avgLatency[0]?.avg || 0,
      dailyStats: dailyStats.map(d => ({ date: d._id, count: d.count }))
    };

    return successResponse(res, stats, 'Usage stats retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
