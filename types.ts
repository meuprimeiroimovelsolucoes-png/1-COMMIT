
export enum View {
  DASHBOARD = 'DASHBOARD',
  REMARKETING = 'REMARKETING',
  CRM = 'CRM',
  CALCULATOR = 'CALCULATOR',
  SOCIAL = 'SOCIAL',
  CONTENT = 'CONTENT',
  MANAGEMENT = 'MANAGEMENT'
}

// SQL: tipo_usuario IN ('corretor', 'gestor', 'admin')
export type UserRole = 'corretor' | 'gestor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  creci?: string;
  avatar?: string;
  whatsapp?: string; // Added from SQL
}

// SQL: status IN ('novo', 'pendente', 'em_contato', 'documentacao', 'aprovado', 'negado', 'vendido')
export type LeadStatus = 'novo' | 'pendente' | 'em_contato' | 'documentacao' | 'aprovado' | 'negado' | 'vendido';

// SQL: etapa_negociacao IN (...)
export type NegotiationStage = 'contrato_construtora_assinado' | 'aguardando_assinatura_caixa' | 'contrato_caixa_assinado';

export interface SaleDetails {
  propertyValue: number; // valor_imovel
  invoiceValue: number; // valor_nota
  developmentName: string; // empreendimento
  stage: NegotiationStage; // etapa_negociacao
  saleDate: string;
  notes?: string;
}

// Status de documento não existe na tabela SQL 'documentos', mas mantido para funcionalidade de frontend 'Fila de Aprovação'
export type DocumentStatus = 'ENVIADO' | 'PENDENTE' | 'APROVADO' | 'REJEITADO';

// SQL: tipo_documento IN (...)
export type DocumentType = 'rg_cnh' | 'comprovante_renda' | 'declaracao_ir' | 'extratos_bancarios' | 'comprovante_residencia' | 'outros';

export interface LeadDocument {
  id: string;
  name: string; // nome_arquivo
  type: DocumentType; // tipo_documento
  url: string; // arquivo_url
  size: string; // tamanho_arquivo (simulated format)
  uploadedAt: string; // created_at
  uploaderName?: string; // enviado_por (resolved name)
  isActive?: boolean;
  status: DocumentStatus; 
}

export interface Lead {
  id: string;
  name: string;
  phone: string; // telefone
  income?: number; // renda_mensal
  status: LeadStatus;
  visitDate?: string; // campo auxiliar frontend
  saleDetails?: SaleDetails;
  documents?: LeadDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  clientName: string;
  propertyName: string;
  value: number; // valor_imovel
  invoiceValue?: number; // valor_nota
  development?: string; // empreendimento
  status: NegotiationStage; // etapa_negociacao
  date: string;
}

export interface BrokerPerformance {
  id: string;
  name: string;
  sales: number;
  totalValue: number;
  activeLeads: number;
  conversionRate: string;
  messagesCount: number;
  lastLogin?: string;
}

export interface SocialPost {
  id: string;
  date: string; 
  platform: 'instagram_feed' | 'instagram_story';
  content: string;
  caption?: string;
  status: 'scheduled' | 'posted' | 'pending_approval' | 'rejected';
  imagePlaceholder?: string;
  createdBy?: string;
}

// --- Content Approval Types ---
export type ContentStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export interface PropertyContent {
  id: string;
  projectName: string;
  type: 'photo' | 'video' | 'book';
  url: string;
  thumbnail: string;
  status: ContentStatus; // Field for approval flow
  createdBy?: string; // Who uploaded it
}

export interface Campaign {
  id: string;
  title: string;
  message: string;
  audienceCount: number;
  scheduledFor: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  type: string;
}

export enum CommissionType {
  NEW = 0.04, // 4%
  USED = 0.05 // 5%
}
