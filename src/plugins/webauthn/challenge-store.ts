import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server'
import { FastifyRequest } from 'fastify'

export type Challenge = PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON

export interface ChallengeStoreHelpers {
  storeChallenge(
    challenge: Challenge,
    request: FastifyRequest,
  ): void;

  getRegistrationChallenge(request: FastifyRequest): PublicKeyCredentialCreationOptionsJSON | null;

  getRequestChallenge(request: FastifyRequest): PublicKeyCredentialRequestOptionsJSON | null;
}

export function storeChallenge(
  challenge: Challenge,
  request: FastifyRequest,
): void {
  request.session.webauthnChallenge = challenge
}

export function getRegistrationChallenge(request: FastifyRequest): PublicKeyCredentialCreationOptionsJSON | null {
  const challenge = request.session.webauthnChallenge
  if (isRegistrationChallenge(challenge)) {
    return challenge
  }
  return null
}

export function getRequestChallenge(request: FastifyRequest): PublicKeyCredentialRequestOptionsJSON | null {
  const challenge = request.session.webauthnChallenge
  if (isRequestChallenge(challenge)) {
    return challenge
  }
  return null
}

function isRegistrationChallenge(challenge?: Challenge | null): challenge is PublicKeyCredentialCreationOptionsJSON {
  return !!(
    challenge
    && typeof challenge === 'object'
    && 'rp' in challenge
    && 'user' in challenge
    && 'challenge' in challenge
    && 'pubKeyCredParams' in challenge
  )
}

function isRequestChallenge(challenge?: Challenge | null): challenge is PublicKeyCredentialRequestOptionsJSON {
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