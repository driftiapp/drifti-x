import { Router } from 'express';
import { SlackService } from '../services/slack.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();
const slackService = SlackService.getInstance();

// Test Slack integration
router.post('/slack', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { message, channel } = req.body;
    
    const success = await slackService.sendMessage({
      text: message || 'Test message from Driftix backend',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message || '*Test Message*\nThis is a test message from the Driftix backend.'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Sent by: ${req.user?.email || 'Unknown'}`
            }
          ]
        }
      ]
    }, channel);

    if (success) {
      res.json({ success: true, message: 'Slack message sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send Slack message' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending Slack message', error });
  }
});

export default router; 