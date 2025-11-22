
import { Lead, Sale, PropertyContent, SocialPost, User, BrokerPerformance } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'João Doe',
    email: 'corretor@imob.com',
    role: 'corretor',
    creci: '12345-F',
    avatar: 'JD',
    whatsapp: '11999990000'
  },
  {
    id: 'u2',
    name: 'Ana Gestora',
    email: 'gestao@imob.com',
    role: 'gestor',
    creci: '99999-J',
    avatar: 'AG',
    whatsapp: '11999990001'
  }
];

export const MOCK_LEADS: Lead[] = [
  { 
    id: '1', 
    name: 'Maria Silva', 
    phone: '11999999991', 
    income: 5000, 
    status: 'novo', 
    created_at: '2023-10-20',
    documents: []
  },
  { 
    id: '2', 
    name: 'João Souza', 
    phone: '11999999992', 
    income: 8500, 
    status: 'em_contato', 
    created_at: '2023-10-21',
    documents: [
      { id: 'd1', name: 'RG_Joao.pdf', type: 'rg_cnh', size: '1.2MB', url: '#', uploadedAt: '2023-10-21T10:00:00', status: 'APROVADO', uploaderName: 'João Doe' },
      { id: 'd2', name: 'Holerite_Out.pdf', type: 'comprovante_renda', size: '0.8MB', url: '#', uploadedAt: '2023-10-22T14:30:00', status: 'PENDENTE', uploaderName: 'João Doe' }
    ]
  },
  { 
    id: '3', 
    name: 'Carlos Pereira', 
    phone: '11999999993', 
    income: 12000, 
    status: 'documentacao', 
    created_at: '2023-10-25',
    documents: [
       { id: 'd3', name: 'CNH_Carlos.jpg', type: 'rg_cnh', size: '2.5MB', url: '#', uploadedAt: '2023-10-25T09:15:00', status: 'PENDENTE', uploaderName: 'João Doe' }
    ]
  },
  { 
    id: '4', 
    name: 'Ana Oliveira', 
    phone: '11999999994', 
    income: 3200, 
    status: 'negado', 
    created_at: '2023-10-26',
    documents: []
  },
  { 
    id: '5', 
    name: 'Pedro Santos', 
    phone: '11999999995', 
    income: 15000, 
    status: 'vendido', 
    created_at: '2023-10-15',
    documents: [
      { id: 'd4', name: 'Contrato_Assinado.pdf', type: 'outros', size: '4.1MB', url: '#', uploadedAt: '2023-10-15T16:00:00', status: 'APROVADO', uploaderName: 'João Doe' }
    ],
    saleDetails: {
      propertyValue: 450000,
      invoiceValue: 15000,
      developmentName: 'Reserva Imperial',
      stage: 'contrato_caixa_assinado',
      saleDate: '2023-10-15',
      notes: 'Cliente investidor'
    }
  },
];

export const MOCK_SALES: Sale[] = [
  { id: '101', clientName: 'Roberto Firmino', propertyName: 'Reserva do Parque', value: 450000, invoiceValue: 18000, development: 'Reserva do Parque', status: 'contrato_construtora_assinado', date: '2023-10-15' },
  { id: '102', clientName: 'Julia Roberts', propertyName: 'Edifício Horizon', value: 890000, invoiceValue: 35600, development: 'Edifício Horizon', status: 'contrato_caixa_assinado', date: '2023-09-10' },
  { id: '103', clientName: 'Tom Hanks', propertyName: 'Vila Verde', value: 320000, invoiceValue: 12800, development: 'Vila Verde', status: 'contrato_caixa_assinado', date: '2023-08-05' },
];

export const MOCK_CONTENT: PropertyContent[] = [
  { id: 'c1', projectName: 'Reserva Imperial', type: 'book', url: '#', thumbnail: 'https://picsum.photos/300/200?random=1', status: 'APROVADO', createdBy: 'Sistema' },
  { id: 'c2', projectName: 'Reserva Imperial', type: 'photo', url: '#', thumbnail: 'https://picsum.photos/300/200?random=2', status: 'APROVADO', createdBy: 'Sistema' },
  { id: 'c3', projectName: 'Grand View Tower', type: 'video', url: '#', thumbnail: 'https://picsum.photos/300/200?random=3', status: 'APROVADO', createdBy: 'Sistema' },
  { id: 'c4', projectName: 'Grand View Tower', type: 'photo', url: '#', thumbnail: 'https://picsum.photos/300/200?random=4', status: 'APROVADO', createdBy: 'Sistema' },
  { id: 'c5', projectName: 'Casa Verde', type: 'book', url: '#', thumbnail: 'https://picsum.photos/300/200?random=5', status: 'APROVADO', createdBy: 'Sistema' },
];

export const MOCK_POSTS: SocialPost[] = [
  { id: 'p1', date: new Date().toISOString().split('T')[0], platform: 'instagram_feed', content: 'Foto da fachada', caption: 'Oportunidade única!', status: 'posted', imagePlaceholder: 'https://picsum.photos/100/100?random=10', createdBy: 'Sistema' },
];

// Management Mock Data
export const MOCK_BROKER_PERFORMANCE: BrokerPerformance[] = [
  { id: 'u1', name: 'João Doe', sales: 4, totalValue: 1850000, activeLeads: 45, conversionRate: '3.2%', messagesCount: 412, lastLogin: 'Hoje, 09:00' },
  { id: 'u3', name: 'Carlos Vendas', sales: 6, totalValue: 2400000, activeLeads: 32, conversionRate: '5.1%', messagesCount: 850, lastLogin: 'Ontem, 18:30' },
  { id: 'u4', name: 'Maria Corretora', sales: 2, totalValue: 650000, activeLeads: 58, conversionRate: '1.8%', messagesCount: 230, lastLogin: 'Hoje, 10:15' },
  { id: 'u5', name: 'Pedro Novato', sales: 0, totalValue: 0, activeLeads: 15, conversionRate: '0%', messagesCount: 45, lastLogin: '2 dias atrás' },
];
