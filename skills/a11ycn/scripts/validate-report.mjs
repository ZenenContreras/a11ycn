/**
 * Dependency-free validator for a11ycn report.json.
 * Usage: node skills/a11ycn/scripts/validate-report.mjs report.json
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SEVERITIES = ["critical", "serious", "moderate", "minor"];
const FRAMEWORKS = ["next-app-router", "next-pages", "vite-react", "unknown"];
const STATUSES = ["confirmed", "needs_review"];
const SOURCES = ["static", "browser", "manual"];
const LEVELS = ["A", "AA", "AAA"];
const CHECK_STATUSES = ["todo", "pass", "fail"];

export function validateReport(report) {
  const errors = [];
  if (!isObject(report)) return ["Report must be an object."];

  if (report.tool !== "a11ycn") errors.push('tool must be "a11ycn".');
  if (typeof report.version !== "string" || report.version.length === 0) {
    errors.push("version must be a non-empty string.");
  }
  if (typeof report.generatedAt !== "string" || Number.isNaN(Date.parse(report.generatedAt))) {
    errors.push("generatedAt must be an ISO-8601 date string.");
  }

  const target = report.target;
  if (!isObject(target)) {
    errors.push("target must be an object.");
  } else {
    if (typeof target.path !== "string" || target.path.length === 0) errors.push("target.path must be a string.");
    if (target.url !== null && typeof target.url !== "string") errors.push("target.url must be a string or null.");
    if (!FRAMEWORKS.includes(target.framework)) errors.push(`target.framework must be one of ${FRAMEWORKS.join(", ")}.`);
    if (typeof target.shadcn !== "boolean") errors.push("target.shadcn must be a boolean.");
  }

  const summary = report.summary;
  if (!isObject(summary)) {
    errors.push("summary must be an object.");
  } else {
    if (!isScore(summary.score)) errors.push("summary.score must be an integer from 0 to 100.");
    if (!isCount(summary.filesScanned)) errors.push("summary.filesScanned must be a non-negative integer.");
    for (const severity of SEVERITIES) {
      if (!isCount(summary[severity])) errors.push(`summary.${severity} must be a non-negative integer.`);
    }
  }

  if (!Array.isArray(report.findings)) {
    errors.push("findings must be an array.");
  } else {
    const ids = new Set();
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    report.findings.forEach((finding, index) => {
      const label = `findings[${index}]`;
      if (!isObject(finding)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      if (typeof finding.id !== "string" || !/^A11Y-\d{4,}$/.test(finding.id)) {
        errors.push(`${label}.id must look like A11Y-0001.`);
      } else if (ids.has(finding.id)) errors.push(`${label}.id is duplicated.`);
      else ids.add(finding.id);
      if (typeof finding.ruleId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finding.ruleId)) {
        errors.push(`${label}.ruleId must be kebab-case.`);
      }
      if (!SEVERITIES.includes(finding.severity)) errors.push(`${label}.severity is invalid.`);
      else counts[finding.severity] += 1;
      if (!STATUSES.includes(finding.status)) errors.push(`${label}.status is invalid.`);
      if (!SOURCES.includes(finding.source)) errors.push(`${label}.source is invalid.`);
      if (typeof finding.file !== "string" || finding.file.length === 0) errors.push(`${label}.file is required.`);
      if (!isPositive(finding.line)) errors.push(`${label}.line must be a positive integer.`);
      if (!isPositive(finding.column)) errors.push(`${label}.column must be a positive integer.`);
      for (const key of ["snippet", "message", "whoIsAffected", "docs"]) {
        if (typeof finding[key] !== "string") errors.push(`${label}.${key} must be a string.`);
      }
      if (!Array.isArray(finding.wcag) || finding.wcag.length === 0) {
        errors.push(`${label}.wcag must be a non-empty array.`);
      } else {
        finding.wcag.forEach((item, wcagIndex) => {
          if (!isObject(item)) {
            errors.push(`${label}.wcag[${wcagIndex}] must be an object.`);
            return;
          }
          if (typeof item.criterion !== "string" || !/^\d+\.\d+\.\d+$/.test(item.criterion)) {
            errors.push(`${label}.wcag[${wcagIndex}].criterion must look like 1.1.1.`);
          }
          if (typeof item.name !== "string" || item.name.length === 0) {
            errors.push(`${label}.wcag[${wcagIndex}].name is required.`);
          }
          if (!LEVELS.includes(item.level)) errors.push(`${label}.wcag[${wcagIndex}].level is invalid.`);
        });
      }
      if (!isObject(finding.fix) || typeof finding.fix.description !== "string" || typeof finding.fix.diff !== "string") {
        errors.push(`${label}.fix must include description and diff strings.`);
      }
    });
    if (isObject(summary)) {
      for (const severity of SEVERITIES) {
        if (summary[severity] !== counts[severity]) {
          errors.push(`summary.${severity} (${summary[severity]}) does not match findings (${counts[severity]}).`);
        }
      }
    }
  }

  if (!Array.isArray(report.manualChecks)) {
    errors.push("manualChecks must be an array.");
  } else {
    report.manualChecks.forEach((check, index) => {
      if (!isObject(check)) {
        errors.push(`manualChecks[${index}] must be an object.`);
        return;
      }
      if (typeof check.id !== "string" || check.id.length === 0) errors.push(`manualChecks[${index}].id is required.`);
      if (!CHECK_STATUSES.includes(check.status)) errors.push(`manualChecks[${index}].status is invalid.`);
      if (typeof check.notes !== "string") errors.push(`manualChecks[${index}].notes must be a string.`);
    });
  }

  return errors;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function isPositive(value) {
  return Number.isInteger(value) && value > 0;
}

function isScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node skills/a11ycn/scripts/validate-report.mjs <report.json>");
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(file, "utf8"));
  const errors = validateReport(report);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(`Valid a11ycn report: ${report.findings.length} findings, score ${report.summary.score}.`);
}
