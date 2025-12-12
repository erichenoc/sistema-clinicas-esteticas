'use client'

import { useState } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Tag,
  X,
  Check,
  Calculator,
  Wallet,
  Package,
  Sparkles,
  History,
  Settings,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency, PAYMENT_METHOD_OPTIONS } from '@/types/pos'
import { createSale } from '@/actions/pos'

// Types
interface CartItem {
  id: string
  type: 'treatment' | 'package' | 'product'
  name: string
  price: number
  quantity: number
  discount: number
}

interface POSClientProps {
  treatments: { id: string; name: string; price: number; category: string; color: string }[]
  packages: { id: string; name: string; price: number; originalPrice: number; sessions: number }[]
  products: { id: string; name: string; price: number; stock: number }[]
  patients: { id: string; name: string; phone: string; email: string | null; credit: number }[]
}

export function POSClient({ treatments, packages, products, patients }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPatient, setSelectedPatient] = useState<POSClientProps['patients'][0] | null>(null)
  const [patientOpen, setPatientOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [useCredit, setUseCredit] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Cart functions
  const addToCart = (item: Omit<CartItem, 'quantity' | 'discount'>) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1, discount: 0 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setSelectedPatient(null)
    setCouponCode('')
    setCouponDiscount(0)
    setUseCredit(false)
  }

  // Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity * (1 - item.discount / 100),
    0
  )
  const creditAmount = useCredit && selectedPatient?.credit ? Math.min(selectedPatient.credit, subtotal) : 0
  const total = Math.max(0, subtotal - couponDiscount - creditAmount)

  // Apply coupon
  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setCouponDiscount(subtotal * 0.1)
      toast.success('Cupon aplicado: 10% de descuento')
    } else if (couponCode.toUpperCase() === 'SUMMER20') {
      setCouponDiscount(subtotal * 0.2)
      toast.success('Cupon aplicado: 20% de descuento')
    } else {
      toast.error('Cupon no valido')
    }
  }

  // Process payment
  const processPayment = async (paymentMethod: string) => {
    setIsProcessing(true)

    const result = await createSale({
      patient_id: selectedPatient?.id,
      customer_name: selectedPatient?.name,
      items: cart.map((item) => ({
        item_type: item.type,
        item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: (item.price * item.quantity * item.discount) / 100,
      })),
      subtotal,
      discount_total: couponDiscount + creditAmount,
      tax_amount: 0,
      total,
      payment_method: paymentMethod,
    })

    setIsProcessing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Venta ${result.data?.sale_number} procesada correctamente`)
      setPaymentDialogOpen(false)
      clearCart()
    }
  }

  // Filter items based on search
  const filteredTreatments = treatments.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] gap-4 p-0 -m-6">
      {/* Left Panel - Products/Services */}
      <div className="flex-1 flex flex-col bg-background p-4 min-h-[50vh] lg:min-h-0">
        {/* Search and Tabs */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tratamientos, paquetes o productos..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="treatments" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="treatments" className="text-xs sm:text-sm px-2 sm:px-3">
                <Sparkles className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tratamientos</span>
                <span className="sm:hidden">Trat.</span>
              </TabsTrigger>
              <TabsTrigger value="packages" className="text-xs sm:text-sm px-2 sm:px-3">
                <Package className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Paquetes
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-3">
                <Tag className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Productos</span>
                <span className="sm:hidden">Prod.</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="treatments" className="mt-4">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTreatments.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No hay tratamientos disponibles
                    </div>
                  ) : (
                    filteredTreatments.map((treatment) => (
                      <Card
                        key={treatment.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() =>
                          addToCart({
                            id: treatment.id,
                            type: 'treatment',
                            name: treatment.name,
                            price: treatment.price,
                          })
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{treatment.name}</p>
                              <Badge
                                variant="outline"
                                className="mt-1 text-xs"
                                style={{ borderColor: treatment.color, color: treatment.color }}
                              >
                                {treatment.category}
                              </Badge>
                            </div>
                            <p className="font-bold text-sm whitespace-nowrap">
                              {formatCurrency(treatment.price)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="packages" className="mt-4">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {packages.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No hay paquetes disponibles
                    </div>
                  ) : (
                    packages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() =>
                          addToCart({
                            id: pkg.id,
                            type: 'package',
                            name: pkg.name,
                            price: pkg.price,
                          })
                        }
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{pkg.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-sm text-green-600">
                              {formatCurrency(pkg.price)}
                            </span>
                            {pkg.originalPrice > pkg.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(pkg.originalPrice)}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {pkg.sessions} sesiones
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="products" className="mt-4">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No hay productos disponibles
                    </div>
                  ) : (
                    products.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            type: 'product',
                            name: product.name,
                            price: product.price,
                          })
                        }
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{product.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-sm">
                              {formatCurrency(product.price)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Stock: {product.stock}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-[400px] bg-card border-t lg:border-t-0 lg:border-l flex flex-col">
        {/* Patient Selection */}
        <div className="p-4 border-b">
          <Label className="text-xs text-muted-foreground">Cliente</Label>
          <Popover open={patientOpen} onOpenChange={setPatientOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start mt-1"
              >
                <User className="mr-2 h-4 w-4" />
                {selectedPatient ? selectedPatient.name : 'Seleccionar paciente'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar paciente..." />
                <CommandList>
                  <CommandEmpty>No encontrado</CommandEmpty>
                  <CommandGroup>
                    {patients.map((patient) => (
                      <CommandItem
                        key={patient.id}
                        value={patient.name}
                        onSelect={() => {
                          setSelectedPatient(patient)
                          setPatientOpen(false)
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.phone}</p>
                        </div>
                        {patient.credit > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Wallet className="mr-1 h-3 w-3" />
                            {formatCurrency(patient.credit)}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Carrito vacio</p>
                <p className="text-xs mt-1">Selecciona items para agregar</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-bold text-sm w-20 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Discounts */}
        {cart.length > 0 && (
          <div className="p-4 border-t space-y-3">
            {/* Coupon */}
            <div className="flex gap-2">
              <Input
                placeholder="Codigo de cupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button variant="outline" onClick={applyCoupon} disabled={!couponCode}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>

            {/* Use Credit */}
            {selectedPatient && selectedPatient.credit > 0 && (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Usar credito disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{formatCurrency(selectedPatient.credit)}</Badge>
                  <Button
                    variant={useCredit ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseCredit(!useCredit)}
                  >
                    {useCredit ? <Check className="h-4 w-4" /> : 'Aplicar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="p-4 border-t bg-muted/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Cupon</span>
              <span>-{formatCurrency(couponDiscount)}</span>
            </div>
          )}
          {creditAmount > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Credito</span>
              <span>-{formatCurrency(creditAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={cart.length === 0 || total === 0}>
                <CreditCard className="mr-2 h-4 w-4" />
                Cobrar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Procesar Pago</DialogTitle>
                <DialogDescription>
                  Total a cobrar: <strong>{formatCurrency(total)}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 py-4">
                {PAYMENT_METHOD_OPTIONS.slice(0, 4).map((method) => (
                  <Button
                    key={method.value}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    disabled={isProcessing}
                    onClick={() => processPayment(method.value)}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        {method.value === 'cash' && <Banknote className="h-6 w-6" />}
                        {method.value === 'card_debit' && <CreditCard className="h-6 w-6" />}
                        {method.value === 'card_credit' && <CreditCard className="h-6 w-6" />}
                        {method.value === 'transfer' && <ArrowRightLeft className="h-6 w-6" />}
                      </>
                    )}
                    {method.label}
                  </Button>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t flex justify-center gap-4">
          <Button variant="ghost" size="sm">
            <History className="mr-2 h-4 w-4" />
            Historial
          </Button>
          <Button variant="ghost" size="sm">
            <Calculator className="mr-2 h-4 w-4" />
            Caja
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Config
          </Button>
        </div>
      </div>
    </div>
  )
}
