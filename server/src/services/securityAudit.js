function securityAudit(event, { actorId, method, route, status } = {}) {
  console.info(JSON.stringify({
    time: new Date().toISOString(), event: 'security.' + event, actorId, method, route, status,
  }));
}

module.exports = securityAudit;
