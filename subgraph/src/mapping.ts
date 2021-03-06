import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  Donation as DonationEvent,
  MaintainerChanged,
  MaintenanceFeeChanged,
  OwnershipTransferred,
  UBIBurnerChanged,
  donationPerMonthChanged
} from "../generated/KlerosboardSuscription/KlerosboardSuscription"
import { KBSubscription, Donor, Donation } from "../generated/schema"

export function handleDonation(event: DonationEvent): void {
  let donation_id = event.transaction.hash.toHexString() + '-' + event.transaction.index.toHexString();
  let donor = getOrCreateDonor(event.params.from);
  
  log.debug("handleDonation: Creating Donation entity with id {}.", [donation_id])
  let donation = new Donation(donation_id);
  donation.amount = event.params.amount;
  donation.donor = donor.id;
  donation.timestamp = event.block.timestamp;
  donation.ethToUBIBurner = event.params.ethToUbiBurner;
  donation.ethToMaintainance = donation.amount.minus(donation.ethToUBIBurner);
  donation.save();

  log.debug("handleDonation: Updating KBS donations array.", [donation_id])
  let kbs = getOrCreateKBS();
  kbs.totalDonated = kbs.totalDonated.plus(event.params.amount);
  kbs.totalETHToUBIBurner = kbs.totalETHToUBIBurner.plus(donation.ethToUBIBurner);
  kbs.save()

  log.debug("handleDonation: Updating Donor {} information.", [event.params.from.toString()])

  donor.lastDonated = event.params.amount;
  donor.lastDonatedTimestamp = event.block.timestamp;
  donor.totalDonated = donor.totalDonated.plus(event.params.amount);
  donor.totalETHToUBIBurner = donor.totalETHToUBIBurner.plus(donation.ethToUBIBurner);
  donor.save();

}

export function handleMaintainerChanged(event: MaintainerChanged): void {
  log.debug("handleMaintainerChanged: New Maintainer set to {}", [event.params.newMaintainer.toString()]);
  let kbs = getOrCreateKBS();
  kbs.maintainer = event.params.newMaintainer;
  kbs.save();
}

export function handleMaintenanceFeeChanged(event: MaintenanceFeeChanged): void {
  let newMaintenance = event.params.maintenanceFeeMultiplier
  log.debug("handleMaintenanceFeeChanged: New maintainanceFee set to {}", [newMaintenance.toString()]);
  let kbs = getOrCreateKBS();
  kbs.maintenanceFeeMultiplier = newMaintenance;
  kbs.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.debug("handleOwnershipTransferred: New Owner set to {}", [event.params.newOwner.toString()]);
  let kbs = getOrCreateKBS();
  kbs.owner = event.params.newOwner;
  kbs.save();
}

export function handleUBIBurnerChanged(event: UBIBurnerChanged): void {
  let kbs = getOrCreateKBS();
  log.debug("handleUBIBurnerChanged: New UBIBurner set to {}", [event.params.ubiburner.toString()]);
  kbs.UBIBurner = event.params.ubiburner;
  kbs.save();
}

export function handledonationPerMonthChanged(
  event: donationPerMonthChanged
): void {
  let kbs = getOrCreateKBS();
  log.debug("handledonationPerMonthChanged: New donationperMonth set to {}", [event.params.donationAmount.toString()]);
  kbs.donationPerMonth = event.params.donationAmount;
  kbs.save();
}

function getOrCreateKBS(): KBSubscription {
  let kbs = KBSubscription.load('0x0');
  if (kbs == null) {
    log.debug("getOrCreateKBS: Creating new KBS", [])
    kbs = new KBSubscription('0x0');
    kbs.maintenanceFeeMultiplier = BigInt.fromI32(0);
    kbs.donationPerMonth = BigInt.fromI32(0);
    kbs.maintainer = new Address(0x0);
    kbs.UBIBurner = new Address(0x0);
    kbs.owner = new Address(0x0);
    kbs.totalDonated = BigInt.fromI32(0);
    kbs.totalETHToUBIBurner = BigInt.fromI32(0);
    kbs.save();
  }
  return kbs
}

function getOrCreateDonor(address: Address): Donor {
  let donor = Donor.load(address.toHexString());
  if (donor == null){
    log.debug("getOrCreateDonor: Creating donor {}", [address.toString()]);
    donor = new Donor(address.toHexString());
    donor.lastDonated = BigInt.fromI32(0);
    donor.totalDonated = BigInt.fromI32(0);
    donor.totalETHToUBIBurner = BigInt.fromI32(0);
    donor.save();
  }
  return donor;
}
