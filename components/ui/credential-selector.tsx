"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, Key, Database, Mail, Globe, Trash2, Edit3 } from 'lucide-react'
import { Button } from './button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { MobileSheet } from './mobile-sheet'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { credentialStore, type StoredCredential } from '@/lib/credential-store'
import { SecurityBadge, SecurityWarning } from './security-status'
import { SECURITY_WARNINGS } from '@/lib/security'
import { CredentialType } from '@/types/credentials'

interface CredentialSelectorProps {
  value: string
  onChange: (credentialId: string) => void
  credentialType?: CredentialType
  placeholder?: string
  className?: string
}

interface NewCredentialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credentialType: CredentialType
  onCredentialCreated: (credentialId: string) => void
}

function NewCredentialDialog({ open, onOpenChange, credentialType, onCredentialCreated }: NewCredentialDialogProps) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640) // 640px is the 'sm' breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleCreate = async () => {
    if (!name.trim() || !value.trim()) return

    setLoading(true)
    try {
      const credentialId = credentialStore.storeCredential(
        name.trim(),
        value.trim(),
        credentialType,
        description.trim() || undefined
      )
      
      onCredentialCreated(credentialId)
      onOpenChange(false)
      
      // Reset form
      setName('')
      setValue('')
      setDescription('')
    } catch (error) {
      console.error('Failed to create credential:', error)
      alert('Failed to create credential. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholder = () => {
    switch (credentialType) {
      case 'database':
        return 'postgresql://user:password@localhost:5432/dbname'
      case 'api':
        return 'sk-1234567890abcdef...'
      case 'email':
        return 'your-app-password'
      default:
        return 'Your secret value'
    }
  }

  const getIcon = () => {
    switch (credentialType) {
      case 'database':
        return <Database className="w-4 h-4" />
      case 'api':
        return <Globe className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      default:
        return <Key className="w-4 h-4" />
    }
  }

  const getTypeLabel = () => {
    switch (credentialType) {
      case 'database':
        return 'Database'
      case 'api':
        return 'API'
      case 'email':
        return 'Email'
      default:
        return 'Generic'
    }
  }

  const renderContent = () => (
    <div className="space-y-3">
      <SecurityWarning 
        message={SECURITY_WARNINGS.CREDENTIAL_STORAGE}
        type="info"
      />
      
      <div className="space-y-1.5">
        <Label htmlFor="cred-name" className="text-gray-700 text-sm">Name</Label>
        <Input
          id="cred-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`My ${getTypeLabel()} Connection`}
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 h-9"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="cred-value" className="text-gray-700 text-sm">
          {credentialType === 'database' ? 'Connection String' : 'Value'}
        </Label>
        <Input
          id="cred-value"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={getPlaceholder()}
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 h-9"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="cred-desc" className="text-gray-700 text-sm">Description (optional)</Label>
        <Input
          id="cred-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this credential"
          className="bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 h-9"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between sm:items-center">
        <SecurityBadge />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-9 touch-manipulation flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !value.trim() || loading}
            className="bg-blue-600 text-white hover:bg-blue-700 h-9 touch-manipulation flex-1 sm:flex-none"
          >
            {loading ? 'Creating...' : 'Create Credential'}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sheet */}
      {isMobile && (
        <MobileSheet 
          open={open}
          onOpenChange={onOpenChange}
          title={`New ${getTypeLabel()} Credential`}
          description="Create a new secure credential that will be encrypted and stored locally."
        >
          {renderContent()}
        </MobileSheet>
      )}

      {/* Desktop Dialog */}
      {!isMobile && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="border-gray-200 bg-white text-gray-900 sm:max-w-md sm:!top-1/2 sm:!left-1/2 sm:!-translate-x-1/2 sm:!-translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900">
                {getIcon()}
                New {getTypeLabel()} Credential
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new secure credential that will be encrypted and stored locally.
              </DialogDescription>
            </DialogHeader>
            
            {renderContent()}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export function CredentialSelector({ 
  value, 
  onChange, 
  credentialType = 'generic',
  placeholder = "Select a credential",
  className = "" 
}: CredentialSelectorProps) {
  const [credentials, setCredentials] = useState<Omit<StoredCredential, 'encryptedValue'>[]>([])
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  const loadCredentials = useCallback(() => {
    const creds = credentialStore.getCredentialsByType(credentialType)
    setCredentials(creds)
  }, [credentialType])

  useEffect(() => {
    setMounted(true)
    loadCredentials()
  }, [credentialType, loadCredentials])

  const handleCredentialCreated = (credentialId: string) => {
    onChange(credentialId)
    loadCredentials() // Refresh the list
  }

  const getIcon = () => {
    switch (credentialType) {
      case 'database':
        return <Database className="w-4 h-4" />
      case 'api':
        return <Globe className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      default:
        return <Key className="w-4 h-4" />
    }
  }

  if (!mounted) {
    return null // Avoid hydration issues
  }

  const selectedCredential = credentials.find(c => c.id === value)

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder={placeholder}>
              {selectedCredential && (
                <div className="flex items-center gap-2">
                  {getIcon()}
                  <span className="text-sm">{selectedCredential.name}</span>
                  <SecurityBadge className="ml-auto" />
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {credentials.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                No {credentialType} credentials found
              </div>
            ) : (
              credentials.map((cred) => (
                <SelectItem key={cred.id} value={cred.id}>
                  <div className="flex items-center gap-2 w-full">
                    {getIcon()}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{cred.name}</div>
                      {cred.description && (
                        <div className="text-xs text-gray-500 truncate">{cred.description}</div>
                      )}
                    </div>
                    <SecurityBadge />
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNewDialog(true)}
          title="Create new credential"
          className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 h-9 w-9 transition-colors"
        >
          <Plus className="w-4 h-4 relative z-10" />
        </Button>
      </div>
      
      <NewCredentialDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        credentialType={credentialType}
        onCredentialCreated={handleCredentialCreated}
      />
    </div>
  )
}
