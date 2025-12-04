import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server'
import { FastifyRequest } from 'fastify'

export type Challenge = PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON

export interface StoredChallenge<T extends Challenge = Challenge> {
  url: string;
  challenge: T;
}

export interface ChallengeStoreHelpers {
  storeChallenge(
    challenge: Challenge,
    request: FastifyRequest,
  ): void;

  getRegistrationChallenge(request: FastifyRequest): StoredChallenge<PublicKeyCredentialCreationOptionsJSON> | null;

  getRequestChallenge(request: FastifyRequest): StoredChallenge<PublicKeyCredentialRequestOptionsJSON> | null;
}

export function storeChallenge(
  challenge: Challenge,
  request: FastifyRequest,
): void {
  request.session.webauthnChallenge = { url: request.url, challenge }
}

export function getRegistrationChallenge(request: FastifyRequest): StoredChallenge<PublicKeyCredentialCreationOptionsJSON> | null {
  const storedChallenge = request.session.webauthnChallenge
  if (isRegistrationChallenge(storedChallenge)) {
    return storedChallenge
  }
  return null
}

export function getRequestChallenge(request: FastifyRequest): StoredChallenge<PublicKeyCredentialRequestOptionsJSON> | null {
  const storedChallenge = request.session.webauthnChallenge
  if (isRequestChallenge(storedChallenge)) {
    return storedChallenge
  }
  return null
}

function isRegistrationChallenge(storedChallenge?: StoredChallenge | null): storedChallenge is StoredChallenge<PublicKeyCredentialCreationOptionsJSON> {
  const challenge = storedChallenge?.challenge
  return !!(
    challenge
    && typeof challenge === 'object'
    && 'rp' in challenge
    && 'user' in challenge
    && 'challenge' in challenge
    && 'pubKeyCredParams' in challenge
  )
}

function isRequestChallenge(storedChallenge?: StoredChallenge | null): storedChallenge is StoredChallenge<PublicKeyCredentialRequestOptionsJSON> {
  const challenge = storedChallenge?.challenge
  return !!(
    challenge
    && typeof challenge === 'object'
    && 'challenge' in challenge
    && !('rp' in challenge
      || 'user' in challenge
      || 'pubKeyCredParams' in challenge
    )
  )
}