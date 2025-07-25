export interface Owner {
  id: string;
  isOwner: string;
  mobile1: string;
  memberName: string;
  mobile2: string;
  cars: string;
  bikes: string;
  stickerNos: string;
  blockNumber: string;
  flatNumber: string;
  blockFlatNumber: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  name: string;
  paymentAmount: number;
  paymentDate: string;
  remarks: string;
  blockNumber: string;
  flatNumber: string;
}

export interface FilterOptions {
  searchTerm: string;
}

export interface PropertyData {
  owners: Owner[];
  receipts: Receipt[];
}