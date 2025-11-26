export const systemData = {
  id: 'system_1',
  automatic: false,
  baliza: false,
  sirena: false,
  numberCard: 'relay8694',
  ptzCam: [
    {
      id: 'thermal1',
      type: 'thermal',
      alerts: [],
      hasAlert: true,
      nvrID: 1,
      ip: '10.10.2.3',
    },
  ],
  towers: [
    {
      id: 'torre1',
      cam: [
        {
          id: 'cam1',
          type: 'ptz',
          alerts: [],
          hasAlert: false,
          nvrID: 2,
          ip: '10.10.2.4',
        },
        { id: 'cam2', type: 'normal', alerts: [], hasAlert: true, ip: '10.10.2.10' },
        { id: 'cam3', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.11' },
      ],
      spotlight: [
        { id: 'spotlight1', active: false },
        { id: 'spotlight2', active: false },
      ],
      numberCard: 'relay8714',
    },
    {
      id: 'torre2',
      cam: [
        { id: 'cam4', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.12' },
        { id: 'cam5', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.13' },
        { id: 'cam6', type: 'normal', alerts: [], hasAlert: true, ip: '10.10.2.14' },
      ],
      spotlight: [
        { id: 'spotlight3', active: true },
        { id: 'spotlight4', active: false },
      ],
      numberCard: 'relay8721',
    },
    {
      id: 'torre3',
      cam: [
        { id: 'cam7', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.15' },
        { id: 'cam8', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.16' },
        { id: 'cam9', type: 'normal', alerts: [], hasAlert: true, ip: '10.10.2.17' },
      ],
      spotlight: [
        { id: 'spotlight5', active: false },
        { id: 'spotlight6', active: false },
      ],
      numberCard: 'relay8705',
    },
    {
      id: 'torre4',
      cam: [
        { id: 'cam10', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.18' },
        { id: 'cam11', type: 'normal', alerts: [], hasAlert: false, ip: '10.10.2.19' },
        { id: 'cam12', type: 'normal', alerts: [], hasAlert: true, ip: '10.10.2.20' },
      ],
      spotlight: [
        { id: 'spotlight7', active: false },
        { id: 'spotlight8', active: false },
      ],
      numberCard: 'relay8713',
    },
  ],
}
