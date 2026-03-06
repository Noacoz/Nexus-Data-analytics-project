/**
 * AlertFeed Component
 * Real-time monitoring alerts display
 */

import { useState } from "react";
import { useAlerts } from "../hooks/useAlerts";
import {
  formatDate,
  getSeverityColor,
  getAlertTypeLabel,
} from "../lib/formatting";

export function AlertFeed({ userId }) {
  const { alerts, unreadCount, markSeen } = useAlerts(userId);
  const [expandedAlertId, setExpandedAlertId] = useState(null);

  if (!userId) {
    return (
      <div className="p-6 text-center text-gray-600">
        No user ID provided
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
          {unreadCount > 0 && (
            <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No alerts yet
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                !alert.seen ? "bg-blue-50" : ""
              }`}
              onClick={() => {
                if (!alert.seen) {
                  markSeen(alert.id);
                }
                setExpandedAlertId(
                  expandedAlertId === alert.id ? null : alert.id
                );
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {getAlertTypeLabel(alert.alert_type)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    {alert.title}
                  </h4>
                </div>
                {!alert.seen && (
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-1">{alert.description}</p>
              <p className="text-xs text-gray-500">
                {formatDate(alert.triggered_at)}
              </p>

              {/* Expandable Evidence */}
              {expandedAlertId === alert.id && alert.evidence && (
                <div className="mt-3 p-3 bg-gray-100 rounded text-xs text-gray-700">
                  <p className="font-semibold mb-1">Evidence:</p>
                  <pre className="whitespace-pre-wrap break-words">
                    {typeof alert.evidence === "string"
                      ? alert.evidence
                      : JSON.stringify(alert.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertFeed;
