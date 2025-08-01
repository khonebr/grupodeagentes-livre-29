import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseAgents } from '@/hooks/useSupabaseAgents';
import { useAgentPersistence } from '@/hooks/useAgentPersistence';
import { useToast } from '@/hooks/use-toast';
import { Agent, defaultAgents } from '@/types/agents';

interface SystemSettings {
  systemName: string;
  maxAgents: number;
  enableNotifications: boolean;
  autoSaveInterval: number;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  backupInterval: number;
  maxHistoryDays: number;
}

const defaultSettings: SystemSettings = {
  systemName: 'Chathy Admin',
  maxAgents: 10,
  enableNotifications: true,
  autoSaveInterval: 30,
  enableAnalytics: false,
  enableDebugMode: false,
  backupInterval: 24,
  maxHistoryDays: 30
};

export const SystemSettings = () => {
  const [settings, setSettings] = useLocalStorage<SystemSettings>('system-settings', defaultSettings);
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);
  const { agents } = useSupabaseAgents();
  const { toast } = useToast();
  const { getBackupInfo, forceRestoreFromBackup } = useAgentPersistence(agents, () => {});

  const handleSave = () => {
    setSettings(tempSettings);
    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso!",
    });
  };

  const handleReset = () => {
    setTempSettings(defaultSettings);
    toast({
      title: "Sucesso",
      description: "Configurações restauradas para o padrão!",
    });
  };

  const handleResetLocalStorage = () => {
    if (confirm('⚠️ ATENÇÃO: Esta ação irá apagar dados do usuário atual (agentes personalizados, conversas, configurações), mas preservará dados essenciais do sistema. Esta ação não pode ser desfeita. Tem certeza que deseja contintar?')) {
      if (confirm('Esta é sua última chance! Confirma que deseja resetar os dados do usuário atual?')) {
        // Preservar dados críticos do sistema
        const criticalData = {
          users: localStorage.getItem('chathy-users'),
          currentUser: localStorage.getItem('chathy-current-user'),
          sessionExpiry: localStorage.getItem('chathy-session-expiry'),
        };
        
        // Obter usuário atual do contexto
        const currentUserData = JSON.parse(localStorage.getItem('chathy-current-user') || 'null');
        
        if (currentUserData?.id) {
          // Identificar chaves do usuário atual
          const userKeys = Object.keys(localStorage).filter(key => 
            key.startsWith(`${currentUserData.id}-`)
          );
          
          // Remover apenas dados do usuário atual
          userKeys.forEach(key => localStorage.removeItem(key));
        }
        
        // Garantir que dados críticos ainda existem
        Object.entries(criticalData).forEach(([key, value]) => {
          const storageKey = 
            key === 'users' ? 'chathy-users' : 
            key === 'currentUser' ? 'chathy-current-user' : 
            'chathy-session-expiry';
          
          if (value && !localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, value);
          }
        });
        
        toast({
          title: "Dados do Usuário Apagados",
          description: "Dados do usuário foram removidos, sistema preservado. A página será recarregada.",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleRestoreAgents = () => {
    const success = forceRestoreFromBackup();
    if (success) {
      toast({
        title: "Agentes Restaurados",
        description: "Seus agentes foram restaurados do backup com sucesso!",
      });
    } else {
      toast({
        title: "Erro na Restauração",
        description: "Não foi possível encontrar backup de agentes para restaurar.",
        variant: "destructive",
      });
    }
  };

  const backupInfo = getBackupInfo();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <span>Configurações do Sistema</span>
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={tempSettings.systemName}
                onChange={(e) => updateSetting('systemName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAgents">Máximo de Agentes</Label>
              <Input
                id="maxAgents"
                type="number"
                min="1"
                max="100"
                value={tempSettings.maxAgents}
                onChange={(e) => updateSetting('maxAgents', parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHistoryDays">Dias de Histórico (dias)</Label>
              <Input
                id="maxHistoryDays"
                type="number"
                min="1"
                max="365"
                value={tempSettings.maxHistoryDays}
                onChange={(e) => updateSetting('maxHistoryDays', parseInt(e.target.value) || 1)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Comportamento */}
        <Card>
          <CardHeader>
            <CardTitle>Comportamento do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações do sistema
                </p>
              </div>
              <Switch
                checked={tempSettings.enableNotifications}
                onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Coletar dados de uso para melhorias
                </p>
              </div>
              <Switch
                checked={tempSettings.enableAnalytics}
                onCheckedChange={(checked) => updateSetting('enableAnalytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Debug</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar logs detalhados para desenvolvimento
                </p>
              </div>
              <Switch
                checked={tempSettings.enableDebugMode}
                onCheckedChange={(checked) => updateSetting('enableDebugMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Avançadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="autoSaveInterval">Intervalo de Auto-Save (segundos)</Label>
              <Input
                id="autoSaveInterval"
                type="number"
                min="10"
                max="300"
                value={tempSettings.autoSaveInterval}
                onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) || 30)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupInterval">Intervalo de Backup (horas)</Label>
              <Input
                id="backupInterval"
                type="number"
                min="1"
                max="168"
                value={tempSettings.backupInterval}
                onChange={(e) => updateSetting('backupInterval', parseInt(e.target.value) || 24)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup e Recuperação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>Backup e Recuperação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Status do Backup de Agentes
              </h4>
              {backupInfo ? (
                <div className="space-y-2">
                  <p className="text-sm text-blue-800">
                    Último backup: {new Date(backupInfo.timestamp).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-blue-800">
                    Agentes no backup: {backupInfo.agents?.length || 0}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRestoreAgents}
                    className="mt-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Agentes do Backup
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-blue-800">
                  Nenhum backup de agentes encontrado. Os backups são criados automaticamente quando você cria ou modifica agentes.
                </p>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Backups são criados automaticamente quando você salva agentes</p>
              <p>• Os backups preservam seus agentes personalizados durante limpezas de dados</p>
              <p>• Use a função "Restaurar" se seus agentes desaparecerem</p>
            </div>
          </CardContent>
        </Card>

        {/* Zona de Perigo */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span>Zona de Perigo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2">
                Reset Completo do Sistema
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Esta ação irá apagar TODOS os dados locais incluindo agentes personalizados, 
                histórico de conversas, configurações e preferências. Esta ação não pode ser desfeita.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleResetLocalStorage}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Todos os Dados do Sistema
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Versão</Label>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Última Atualização</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Agentes Ativos</Label>
                <p className="text-sm text-muted-foreground">
                  {JSON.parse(localStorage.getItem('agents') || '[]').filter((a: any) => a.isActive).length}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Espaço Usado</Label>
                <p className="text-sm text-muted-foreground">
                  {(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};