import { randomBytes } from 'node:crypto';

import {
  ErrorCode,
  HttpStatus,
  PLAN_DETAILS,
  type ProjectEmbedUpdateInput,
  PLANS,
} from '@regionify/shared';

import { AppError } from '../middleware/errorHandler.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { prisma } from '../db/index.js';

export type PublicEmbedPayload = {
  countryId: string | null;
  dataset: unknown;
  mapStyles: unknown;
  legendStyles: unknown;
  legendData: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
};

function newEmbedToken(): string {
  return randomBytes(24).toString('base64url');
}

function toKeywordArray(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return null;
  return value.filter((k): k is string => typeof k === 'string');
}

export const projectEmbedService = {
  async getPublicPayloadByToken(token: string): Promise<PublicEmbedPayload> {
    const project = await projectRepository.findByEmbedToken(token);

    if (!project || project.user.plan !== PLANS.chronographer) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Embed not found');
    }

    return {
      countryId: project.countryId,
      dataset: project.dataset,
      mapStyles: project.mapStyles,
      legendStyles: project.legendStyles,
      legendData: project.legendData,
      seoTitle: project.embedSeoTitle,
      seoDescription: project.embedSeoDescription,
      seoKeywords: toKeywordArray(project.embedSeoKeywords),
    };
  },

  async getEmbedMetaForHtml(token: string): Promise<{
    title: string;
    description: string;
    keywords: string | null;
    projectName: string;
  }> {
    const project = await projectRepository.findByEmbedToken(token);

    if (!project || project.user.plan !== PLANS.chronographer) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Embed not found');
    }

    const title = project.embedSeoTitle?.trim() || `${project.name} — Regionify`;
    const description =
      project.embedSeoDescription?.trim() ||
      'Interactive regional map visualization powered by Regionify.';
    const kw = toKeywordArray(project.embedSeoKeywords);
    const keywords = kw && kw.length > 0 ? kw.join(', ') : null;

    return { title, description, keywords, projectName: project.name };
  },

  async updateEmbedSettings(
    userId: string,
    projectId: string,
    input: ProjectEmbedUpdateInput,
  ): Promise<{
    embedEnabled: boolean;
    embedToken: string | null;
    embedSeoTitle: string | null;
    embedSeoDescription: string | null;
    embedSeoKeywords: unknown;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'User not found');
    }

    if (!PLAN_DETAILS[user.plan].limits.publicEmbed) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Public embed requires Chronographer plan',
      );
    }

    const existing = await projectRepository.findById(projectId);

    if (!existing || existing.userId !== userId) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Project not found');
    }

    let embedToken: string | null = existing.embedToken;

    if (input.enabled) {
      embedToken = existing.embedToken ?? newEmbedToken();
    } else {
      embedToken = null;
    }

    const embedSeoKeywords =
      input.seoKeywords === undefined
        ? (existing.embedSeoKeywords as string[] | null)
        : input.seoKeywords;

    const embedSeoTitle = input.enabled ? (input.seoTitle ?? '').trim().slice(0, 200) : null;

    const embedSeoDescription = input.enabled
      ? (input.seoDescription ?? '').trim()
      : input.seoDescription === undefined
        ? existing.embedSeoDescription
        : input.seoDescription === null
          ? null
          : input.seoDescription.trim() || null;

    const updated = await projectRepository.update(projectId, {
      embedEnabled: input.enabled,
      embedToken,
      embedSeoTitle,
      embedSeoDescription,
      embedSeoKeywords: embedSeoKeywords as object | null,
    });

    if (!updated) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Failed to update embed settings',
      );
    }

    return {
      embedEnabled: updated.embedEnabled,
      embedToken: updated.embedToken,
      embedSeoTitle: updated.embedSeoTitle,
      embedSeoDescription: updated.embedSeoDescription,
      embedSeoKeywords: updated.embedSeoKeywords,
    };
  },
};
